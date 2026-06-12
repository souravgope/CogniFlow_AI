import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  // Extract JWT from Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // Fallback to extract from cookies (if front-end stores there)
  else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {});
    token = cookies.token;
  }

  // If no token is provided
  if (!token) {
    return res.status(401).json({ message: "Access denied. Not authorized." });
  }

  try {
    const secret = process.env.JWT_SECRET || "super_secret_cyber_security_key_ai_workspace";
    const decoded = jwt.verify(token, secret);

    // Find user and attach to request
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User session expired or not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ JWT auth validation error:", error.message);
    return res.status(401).json({ message: "Invalid session token." });
  }
};
