const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("❌ No Authorization header");
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("❌ Token missing after Bearer");
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔑 Decoded token:", decoded);

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log("❌ User not found for ID:", decoded.userId);
      return res.status(401).json({ error: "User not found" });
    }

    req.user = { userId: user._id.toString(), role: user.role };
    console.log("✅ Authenticated user:", req.user);

    next();
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = authMiddleware;