// controllers/recommendController.js
import Order from "../models/Order.js"; // optional (for co-purchase); safe if collection is empty
import Product from "../models/Products.js";

// ---- helpers ----
const toPlain = (docs = []) =>
  docs.map((d) => ({
    _id: d._id,
    name: d.name,
    price: d.price,
    imageUrl: d.imageUrl || (Array.isArray(d.images) ? d.images[0] : ""),
    category: d.category || d.categoryName || null,
  }));

const normCat = (c) => {
  if (!c) return null;
  if (typeof c === "string") return c;
  return c?.name || c?.categoryName || null;
};

/**
 * FARM COMPLEMENTS — sample mapping
 * Admin can freely edit these keys/values to match your real category names.
 * e.g. change "Seeds" → "Rice Seeds" if that's how your DB stores it.
 */
export const COMPLEMENT_MAP = new Map([
  ["Seeds",            ["Fertilizers", "Pesticides", "Soil Amendments", "Seed Trays"]],
  ["Fertilizers",      ["Seeds", "Soil Amendments", "Irrigation", "pH/Test Kits"]],
  ["Soil Amendments",  ["Fertilizers", "Seeds", "Mulch", "Compost"]],
  ["Pesticides",       ["Protective Gear", "Sprayers", "Adjuvants", "pH/Test Kits"]],
  ["Herbicides",       ["Protective Gear", "Sprayers", "pH/Test Kits"]],
  ["Fungicides",       ["Protective Gear", "Sprayers", "pH/Test Kits"]],
  ["Insecticides",     ["Protective Gear", "Sprayers", "Sticky Traps"]],

  ["Irrigation",       ["Pipes & Fittings", "Drip Lines", "Sprinklers", "Timers & Controllers", "Filters"]],
  ["Greenhouse",       ["Plastic Films", "Shade Nets", "Misters", "Thermometers", "Seed Trays"]],
  ["Mulch",            ["Drip Lines", "Hand Tools", "Weed Mats"]],

  ["Hand Tools",       ["Gloves", "Sharpeners", "Protective Gear"]],
  ["Power Tools",      ["Fuel & Lubricants", "Protective Gear", "Spare Parts"]],
  ["Farm Machinery",   ["Spare Parts", "Fuel & Lubricants", "Implements", "Safety Kits"]],
  ["Implements",       ["Farm Machinery", "Spare Parts", "Hitch Pins"]],

  ["Livestock Feed",   ["Supplements", "Waterers", "Feeders", "Bedding"]],
  ["Supplements",      ["Livestock Feed", "Mineral Blocks"]],
  ["Veterinary Care",  ["Protective Gear", "Syringes", "Disinfectants"]],
  ["Poultry",          ["Feeders", "Waterers", "Heat Lamps", "Bedding"]],
  ["Aquaculture",      ["Aerators", "Water Test Kits", "Feed"]],

  ["Post-harvest",     ["Sacks & Crates", "Weighing Scales", "Moisture Meters", "Dryers"]],
  ["Sacks & Crates",   ["Weighing Scales", "Ties & Twine"]],
  ["Packaging",        ["Labels", "Sealers", "Sacks & Crates"]],

  ["Protective Gear",  ["Gloves", "Goggles", "Masks/Respirators", "Boots"]],
  ["Gloves",           ["Hand Tools", "Pesticides"]],
  ["Sprayers",         ["Pesticides", "Adjuvants", "Nozzles", "Gaskets"]],
  ["pH/Test Kits",     ["Fertilizers", "Irrigation", "Aquaculture"]],
]);

/**
 * GET /api/recommendations?userId=...&cart=comma,ids&limit=8
 * Lightweight user/cart recommendations (used in Cart screen).
 */
export const recommendForUser = async (req, res) => {
  try {
    const cartIds = String(req.query.cart || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const limit = Math.min(parseInt(req.query.limit || "8", 10), 24);

    let items = [];
    if (cartIds.length) {
      const inCart = await Product.find({ _id: { $in: cartIds } }).lean();
      const cats = [
        ...new Set(
          inCart
            .map((p) => normCat(p?.category || p?.categoryName))
            .filter(Boolean)
        ),
      ];

      if (cats.length) {
        items = await Product.find({
          _id: { $nin: cartIds },
          $or: [{ categoryName: { $in: cats } }, { "category.name": { $in: cats } }],
        })
          .limit(limit)
          .lean();
      }
    }

    // Farm-friendly fallback if nothing found
    if (!items.length) {
      const biasCats = ["Seeds", "Fertilizers", "Irrigation", "Hand Tools", "Livestock Feed"];
      items = await Product.find({
        $or: [{ categoryName: { $in: biasCats } }, { "category.name": { $in: biasCats } }],
      })
        .limit(limit)
        .lean();

      if (!items.length) {
        items = await Product.find({}).sort({ createdAt: -1 }).limit(limit).lean();
      }
    }

    res.json({ items: toPlain(items) });
  } catch (e) {
    console.error("recommendForUser error:", e);
    res.json({ items: [] }); // never crash
  }
};

/**
 * GET /api/recommendations/product/:id?limit=8
 * Per-product recommendations for the Product Detail page.
 */
export const recommendForProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit || "8", 10), 24);

    const base = await Product.findById(id).lean();
    if (!base) return res.json({ similar: [], complementary: [], addons: [] });

    const baseCat = normCat(base.category || base.categoryName);
    const basePrice = Number(base.price || 0);

    // Similar: same category, close in price
    const similarPool = await Product.find({
      _id: { $ne: id },
      $or: [{ categoryName: baseCat }, { "category.name": baseCat }],
    }).lean();

    const similarSorted = [...similarPool]
      .map((p) => ({ p, d: Math.abs(Number(p.price || 0) - basePrice) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, Math.ceil(limit / 2))
      .map((x) => x.p);

    // Complementary: farm complements map
    const comps = COMPLEMENT_MAP.get(baseCat) || [];
    let complementary = [];
    if (comps.length) {
      complementary = await Product.find({
        _id: { $ne: id },
        $or: [
          { categoryName: { $in: comps } },
          { "category.name": { $in: comps } },
        ],
      })
        .limit(Math.ceil(limit / 2))
        .lean();
    }

    // Add-ons (co-purchase, optional)
    let addons = [];
    try {
      const orders = await Order.find({ "items.productId": id })
        .select("items")
        .limit(100)
        .lean();

      const counts = new Map();
      for (const o of orders) {
        const set = new Set(
          (o.items || [])
            .map((i) => String(i.productId))
            .filter((pid) => pid && pid !== String(id))
        );
        for (const pid of set) counts.set(pid, (counts.get(pid) || 0) + 1);
      }
      const topIds = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, Math.ceil(limit / 3))
        .map(([pid]) => pid);

      if (topIds.length) {
        addons = await Product.find({ _id: { $in: topIds } }).lean();
      }
    } catch {
      addons = [];
    }

    res.json({
      similar: toPlain(similarSorted),
      complementary: toPlain(complementary),
      addons: toPlain(addons),
    });
  } catch (e) {
    console.error("recommendForProduct error:", e);
    res.json({ similar: [], complementary: [], addons: [] }); // never crash
  }
};
