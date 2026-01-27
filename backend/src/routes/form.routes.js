import express from "express";
import {
  saveForm,
  getMyForms,
  getForm,
  deleteForm,
  submitForm,
  getFormSubmissions,
  getMySubmissions,
  updateMySubmission
} from "../controllers/form.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post("/", saveForm);
router.get("/", getMyForms);
router.get("/submissions", getMySubmissions);
router.patch("/submissions/:submissionId", updateMySubmission);
router.get("/:id", getForm);
router.delete("/:id", deleteForm);
router.post("/:id/submit", submitForm);
router.get("/:id/submissions", getFormSubmissions);

export default router;
