import jwt from "jsonwebtoken";

/** JWT auth: attaches req.user = { _id, id, userId, email, role } */
export function authMiddleware(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    if (!hdr.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = hdr.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws on bad/expired

    const uid = decoded.id || decoded._id || decoded.sub || decoded.userId;
    if (!uid) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = {
      _id: uid,
      id: uid,
      userId: uid,
      email: decoded.email || null,
      role: decoded.role || "user",
    };

    return next();
  } catch (err) {
    // Make the failure explicit and consistent
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    console.error("AUTH_ERROR:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

/** Optional role guard */
export function allowRoles(...roles) {
  const allow = roles.map((r) => String(r).toLowerCase());
  return (req, res, next) => {
    const role = String(req.user?.role || "").toLowerCase();
    if (!allow.includes(role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}