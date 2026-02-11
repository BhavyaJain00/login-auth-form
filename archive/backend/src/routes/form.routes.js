import express from "express";
import {
  getUserAssignedForms,
  getFormById,
  getPublicForm,
  submitForm,
  submitPublicForm,
  getUserSubmissions,
  getUserSubmission,
  listPublishedForms,
} from "../controllers/form.controller.js";
import { verifyToken, requireUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * PUBLIC ROUTES (No authentication required)
 * These are defined OUTSIDE the middleware chain
 * Must match first, then pass to authenticated routes
 */

// List all published forms (public)
router.get("/public", listPublishedForms);

// Get public form by token - MUST use exact path
router.get("/public/:publicFormToken", getPublicForm);

// Submit public form - MUST use exact path
router.post("/public/submit", submitPublicForm);

/**
 * USER ROUTES (Authentication required)
 * All other routes below require token verification
 */

// Apply token verification and user role check to all remaining routes
router.use(verifyToken, requireUser);

// Get all forms assigned to user
router.get("/", getUserAssignedForms);

// Get user's own submissions (MUST be before /:formId route for correct matching)
router.get("/submissions/my", getUserSubmissions);

// Get specific submission
router.get("/submissions/:submissionId", getUserSubmission);

// Get specific form (Keep this last as it's a catch-all parameter route)
router.get("/:formId", getFormById);

// Submit a form
router.post("/:formId/submit", submitForm);

export default router;
