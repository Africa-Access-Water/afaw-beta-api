const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Role hierarchy: admin > manager > contributor
const ROLE_HIERARCHY = {
  admin: 3,
  manager: 2,
  contributor: 1
};

// Create role-based middleware factory
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Expect: "Bearer <token>"

    if (!token) return res.status(401).json({ error: "No token provided" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // { id, email }

      // Fetch user details to check role
      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user's role is allowed
      const userRole = user.role;
      const userRoleLevel = ROLE_HIERARCHY[userRole];
      
      if (!userRoleLevel) {
        return res.status(403).json({ error: "Invalid user role" });
      }

      // Check if user has sufficient permissions
      const hasPermission = allowedRoles.some(allowedRole => {
        const allowedRoleLevel = ROLE_HIERARCHY[allowedRole];
        return userRoleLevel >= allowedRoleLevel;
      });

      if (!hasPermission) {
        return res.status(403).json({ 
          error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}` 
        });
      }

      // Add user details to request for use in controllers
      req.userDetails = user;
      next();
    } catch (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
  };
};

// Convenience functions for common role checks
const requireAdmin = () => requireRole(['admin']);
const requireManagerOrAbove = () => requireRole(['admin', 'manager']);
const requireAnyRole = () => requireRole(['admin', 'manager', 'contributor']);

module.exports = {
  requireRole,
  requireAdmin,
  requireManagerOrAbove,
  requireAnyRole
};
