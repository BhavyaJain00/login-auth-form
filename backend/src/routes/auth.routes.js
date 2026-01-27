import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  requestPasswordReset,
  resetPassword
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getMe);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;

