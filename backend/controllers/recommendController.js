// controllers/recommendController.js
import Order from "../models/Order.js"; // optional (for co-purchase); safe if collection is empty
import Product from "../models/Products.js";

// ---- helpers ----
const toPlain = (docs = []) =>
  docs.map((d) => {
    // Calculate average rating and review count
    const reviews = d.reviews || [];
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length 
      : 0;
    
    return {
      _id: d._id,
      name: d.name,
      price: d.price,
      imageUrl: d.imageUrl || (Array.isArray(d.images) ? d.images[0] : ""),
      category: d.category || d.categoryName || null,
      reviews: reviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount: reviews.length,
      stock: d.stock || 0,
      weightKg: d.weightKg,
      tags: d.tags || []
    };
  });

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
 * AI-powered user recommendations based on purchase history, search patterns, and behavior.
 */
export const recommendForUser = async (req, res) => {
  try {
    const { userId } = req.query;
    const cartIds = String(req.query.cart || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const limit = Math.min(parseInt(req.query.limit || "8", 10), 24);

    let items = [];
    let userPurchaseHistory = [];
    let userCategories = [];
    let userPriceRange = { min: 0, max: Infinity };

    // 1. Analyze user's purchase history for personalized recommendations
    if (userId) {
      try {
        // Get user's order history
        const userOrders = await Order.find({ userId })
          .populate('items.productId')
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();

        // Extract purchased products and analyze patterns
        for (const order of userOrders) {
          for (const item of order.items || []) {
            if (item.productId && typeof item.productId === 'object') {
              userPurchaseHistory.push(item.productId);
            }
          }
        }

        // Analyze user preferences from purchase history
        if (userPurchaseHistory.length > 0) {
          // Extract frequently purchased categories
          const categoryCount = new Map();
          const prices = [];
          
          userPurchaseHistory.forEach(product => {
            const cat = normCat(product?.category || product?.categoryName);
            if (cat) {
              categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
            }
            if (product.price) {
              prices.push(Number(product.price));
            }
          });

          // Get top 3 categories user buys from
          userCategories = [...categoryCount.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([cat]) => cat);

          // Calculate user's typical price range (25th to 75th percentile)
          if (prices.length > 0) {
            prices.sort((a, b) => a - b);
            const q1Index = Math.floor(prices.length * 0.25);
            const q3Index = Math.floor(prices.length * 0.75);
            userPriceRange = {
              min: prices[q1Index] * 0.7, // 30% below Q1
              max: prices[q3Index] * 1.5   // 50% above Q3
            };
          }
        }
      } catch (error) {
        console.warn("Error analyzing user purchase history:", error);
      }
    }

    // 2. Cart-based recommendations (immediate context)
    if (cartIds.length) {
      const inCart = await Product.find({ _id: { $in: cartIds } }).lean();
      const cartCats = [
        ...new Set(
          inCart
            .map((p) => normCat(p?.category || p?.categoryName))
            .filter(Boolean)
        ),
      ];

      if (cartCats.length) {
        // Find complementary products for cart items
        const cartComplements = [];
        for (const cat of cartCats) {
          const comps = COMPLEMENT_MAP.get(cat) || [];
          cartComplements.push(...comps);
        }

        // Prioritize complementary products, then same category
        const cartRecommendations = await Product.find({
          _id: { $nin: cartIds },
          stock: { $gt: 0 }, // Only include products with stock > 0
          $or: [
            { categoryName: { $in: cartComplements } },
            { "category.name": { $in: cartComplements } },
            { categoryName: { $in: cartCats } },
            { "category.name": { $in: cartCats } }
          ],
          ...(userPriceRange.max !== Infinity && {
            price: { $gte: userPriceRange.min, $lte: userPriceRange.max }
          })
        })
          .limit(Math.ceil(limit * 0.6))
          .lean();

        items.push(...cartRecommendations);
      }
    }

    // 3. User history-based recommendations
    if (userCategories.length > 0 && items.length < limit) {
      const historyRecommendations = await Product.find({
        _id: { 
          $nin: [...cartIds, ...items.map(p => p._id), ...userPurchaseHistory.map(p => p._id)] 
        },
        stock: { $gt: 0 }, // Only include products with stock > 0
        $or: [
          { categoryName: { $in: userCategories } },
          { "category.name": { $in: userCategories } }
        ],
        ...(userPriceRange.max !== Infinity && {
          price: { $gte: userPriceRange.min, $lte: userPriceRange.max }
        })
      })
        .sort({ averageRating: -1, createdAt: -1 })
        .limit(limit - items.length)
        .lean();

      items.push(...historyRecommendations);
    }

    // 4. Collaborative filtering (users who bought similar items)
    if (userPurchaseHistory.length > 0 && items.length < limit) {
      try {
        const purchasedProductIds = userPurchaseHistory.map(p => p._id);
        
        // Find other users who bought similar products
        const similarUserOrders = await Order.find({
          userId: { $ne: userId },
          "items.productId": { $in: purchasedProductIds }
        })
          .populate('items.productId')
          .limit(50)
          .lean();

        // Extract products bought by similar users
        const collaborativeProducts = new Map();
        for (const order of similarUserOrders) {
          for (const item of order.items || []) {
            if (item.productId && typeof item.productId === 'object') {
              const productId = String(item.productId._id);
              if (!purchasedProductIds.some(id => String(id) === productId) &&
                  !cartIds.includes(productId) &&
                  !items.some(p => String(p._id) === productId)) {
                collaborativeProducts.set(productId, item.productId);
              }
            }
          }
        }

        const collaborativeRecommendations = Array.from(collaborativeProducts.values())
          .slice(0, limit - items.length);
        
        items.push(...collaborativeRecommendations);
      } catch (error) {
        console.warn("Error in collaborative filtering:", error);
      }
    }

    // 5. Farm-friendly fallback with user preferences
    if (items.length < limit) {
      const biasCats = userCategories.length > 0 
        ? userCategories 
        : ["Seeds", "Fertilizers", "Irrigation", "Hand Tools", "Livestock Feed"];
      
      const fallbackItems = await Product.find({
        _id: { $nin: [...cartIds, ...items.map(p => p._id)] },
        stock: { $gt: 0 }, // Only include products with stock > 0
        $or: [
          { categoryName: { $in: biasCats } },
          { "category.name": { $in: biasCats } }
        ],
        ...(userPriceRange.max !== Infinity && {
          price: { $gte: userPriceRange.min, $lte: userPriceRange.max }
        })
      })
        .sort({ averageRating: -1, stock: -1 })
        .limit(limit - items.length)
        .lean();

      items.push(...fallbackItems);

      // Final fallback - newest products
      if (items.length < limit) {
        const newestItems = await Product.find({
          _id: { $nin: [...cartIds, ...items.map(p => p._id)] },
          stock: { $gt: 0 } // Only include products with stock > 0
        })
          .sort({ createdAt: -1 })
          .limit(limit - items.length)
          .lean();
        
        items.push(...newestItems);
      }
    }

    // Remove duplicates and limit results
    const uniqueItems = items
      .filter((item, index, self) => 
        index === self.findIndex(t => String(t._id) === String(item._id))
      )
      .slice(0, limit);

    res.json({ 
      items: toPlain(uniqueItems),
      metadata: {
        userCategories,
        userPriceRange: userPriceRange.max !== Infinity ? userPriceRange : null,
        purchaseHistoryCount: userPurchaseHistory.length,
        recommendationType: userId ? 'personalized' : 'general'
      }
    });
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
      stock: { $gt: 0 }, // Only include products with stock > 0
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
        stock: { $gt: 0 }, // Only include products with stock > 0
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
        addons = await Product.find({ 
          _id: { $in: topIds },
          stock: { $gt: 0 } // Only include products with stock > 0
        }).lean();
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
