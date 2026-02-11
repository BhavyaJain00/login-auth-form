import express from "express";
import {
  getAdminUsers,
  createUser,
  deleteUser,
  getAdminForms,
  getAdminFormById,
  createForm,
  updateForm,
  deleteForm,
  publishForm,
  assignUsersToForm,
  getAdminSubmissions,
  getFormSubmissions,
  getUserSubmissions,
} from "../controllers/admin.controller.js";
import {
  verifyToken,
  requireAdmin,
  verifyAdminOwnership,
  verifyUserBelongsToAdmin,
  verifyFormBelongsToAdmin,
  verifySubmissionBelongsToAdmin,
} from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * ADMIN ROUTES
 * All routes require ADMIN role
 */

// Apply token verification and admin role check to all routes
router.use(verifyToken, requireAdmin);

/**
 * USER MANAGEMENT ROUTES
 * ADMINs manage users in their tenant only
 */
router.get("/users", getAdminUsers);
router.post("/users/create", createUser);
router.get("/users/:userId/submissions", getUserSubmissions);  // Must come before DELETE route
router.delete("/users/:userId", deleteUser);

/**
 * FORM MANAGEMENT ROUTES
 * ADMINs manage forms in their tenant only
 */
router.get("/forms", getAdminForms);
router.get("/forms/:formId", getAdminFormById);  // Get single form for editing
router.post("/forms/create", createForm);
router.put("/forms/:formId", updateForm);
router.delete("/forms/:formId", deleteForm);
router.post("/forms/:formId/publish", publishForm);
router.post("/forms/:formId/assign-users", assignUsersToForm);

/**
 * SUBMISSIONS MANAGEMENT ROUTES
 * ADMINs view submissions for their forms only
 */
router.get("/submissions", getAdminSubmissions);
router.get("/forms/:formId/submissions", getFormSubmissions);

export default router;
