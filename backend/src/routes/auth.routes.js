import express from "express";
import {
  adminSignup,
  adminLogin,
  userLogin,
  publicFormLogin,
} from "../controllers/auth.controller.js";
import { verifyToken, requireAdmin, requireUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * ADMIN ROUTES
 */
router.post("/admin/signup", adminSignup);
router.post("/admin/login", adminLogin);

/**
 * USER ROUTES
 */
router.post("/user/login", userLogin);

/**
 * PUBLIC FORM LOGIN
 * Used when non-logged-in user accesses public form link
 */
router.post("/public-form/login", publicFormLogin);

export default router;


