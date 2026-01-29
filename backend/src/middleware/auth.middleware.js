import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production";

/**
 * Verify JWT token and extract user/admin info
 * Attaches user or admin data to req.user
 */
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided. Please login.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
      error: error.message,
    });
  }
};

/**
 * Verify user is an ADMIN
 * TENANT ISOLATION: Ensures admin can only access their own data
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin role required.",
    });
  }
  next();
};

/**
 * Verify user is a USER
 */
export const requireUser = (req, res, next) => {
  if (req.user.role !== "USER") {
    return res.status(403).json({
      success: false,
      message: "Access denied. User role required.",
    });
  }
  next();
};

/**
 * Verify admin owns the resource
 * TENANT ISOLATION: Critical middleware for multi-tenant security
 * Ensures an admin can only access their own tenant data
 */
export const verifyAdminOwnership = (adminIdFromRoute) => {
  return (req, res, next) => {
    if (req.user.role === "ADMIN" && req.user.id !== adminIdFromRoute) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this admin's data.",
      });
    }
    next();
  };
};

/**
 * Verify user belongs to admin's tenant
 * TENANT ISOLATION: Ensures a user can only be accessed by their owning admin
 */
export const verifyUserBelongsToAdmin = (userAdminId) => {
  return (req, res, next) => {
    if (req.user.role === "ADMIN" && req.user.id !== userAdminId) {
      return res.status(403).json({
        success: false,
        message: "This user belongs to another admin tenant.",
      });
    }
    next();
  };
};

/**
 * Verify form belongs to admin's tenant
 * TENANT ISOLATION: Ensures form can only be accessed by its owning admin
 */
export const verifyFormBelongsToAdmin = (formAdminId) => {
  return (req, res, next) => {
    if (req.user.role === "ADMIN" && req.user.id !== formAdminId) {
      return res.status(403).json({
        success: false,
        message: "This form belongs to another admin tenant.",
      });
    }
    // USER role check: only assigned users can access the form
    if (req.user.role === "USER" && !req.user.assignedForms?.includes(formAdminId)) {
      return res.status(403).json({
        success: false,
        message: "This form is not assigned to you.",
      });
    }
    next();
  };
};

/**
 * Verify submission belongs to admin's tenant
 * TENANT ISOLATION: Ensures submission can only be accessed by the form's owning admin
 */
export const verifySubmissionBelongsToAdmin = (submissionAdminId) => {
  return (req, res, next) => {
    if (req.user.role === "ADMIN" && req.user.id !== submissionAdminId) {
      return res.status(403).json({
        success: false,
        message: "This submission belongs to another admin tenant.",
      });
    }
    // USER role check: only can view their own submissions
    if (req.user.role === "USER" && req.user.id !== submissionAdminId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own submissions.",
      });
    }
    next();
  };
};

