import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  requestPasswordReset,
  resetPassword,
  googleLogin
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.get("/me", authMiddleware, getMe);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;

