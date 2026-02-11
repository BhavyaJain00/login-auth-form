import Form from "../models/Form.js";
import FormSubmission from "../models/FormSubmission.js";
import User from "../models/User.js";

/**
 * USER FORM MANAGEMENT
 * ====================
 * Users can:
 * - View forms assigned to them
 * - Submit forms
 * - View their own submissions
 */

/**
 * Get forms assigned to the current user
 * USER: Get only their assigned forms
 */
export const getUserAssignedForms = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user and populate assigned forms
    const user = await User.findById(userId).populate("assignedForms");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assigned forms retrieved successfully.",
      count: user.assignedForms.length,
      forms: user.assignedForms,
    });
  } catch (error) {
    console.error("Get user assigned forms error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving assigned forms.",
      error: error.message,
    });
  }
};

/**
 * Get a specific form by ID
 * USER: Can only access forms assigned to them
 */
export const getFormById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { formId } = req.params;

    // Get form
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found.",
      });
    }

    // TENANT ISOLATION: Verify user has access to this form
    const user = await User.findById(userId);
    const hasAccess = user.assignedForms.some(id => id.toString() === formId.toString());
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this form.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Form retrieved successfully.",
      form,
    });
  } catch (error) {
    console.error("Get form by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving form.",
      error: error.message,
    });
  }
};

/**
 * Get public form by token (no auth required)
 */
export const getPublicForm = async (req, res) => {
  try {
    const { publicFormToken } = req.params;

    const form = await Form.findOne({ publicFormToken, isPublished: true });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found or not published.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Public form retrieved successfully.",
      form: {
        id: form._id,
        title: form.title,
        description: form.description,
        fields: form.fields,
        isPublished: form.isPublished,
      },
    });
  } catch (error) {
    console.error("Get public form error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving public form.",
      error: error.message,
    });
  }
};

/**
 * List all published forms (public)
 */
export const listPublishedForms = async (req, res) => {
  try {
    const forms = await Form.find({ isPublished: true }).select("title description publicFormToken").sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Published forms retrieved successfully.",
      count: forms.length,
      forms,
    });
  } catch (error) {
    console.error("List published forms error:", error);
    return res.status(500).json({ success: false, message: "Error retrieving published forms.", error: error.message });
  }
};

/**
 * Submit a form (USER)
 * Creates a new submission record
 */
export const submitForm = async (req, res) => {
  try {
    const userId = req.user.id;
    const { formId, answers } = req.body;

    if (!formId || !answers) {
      return res.status(400).json({
        success: false,
        message: "Form ID and answers are required.",
      });
    }

    // Get form and verify user has access
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found.",
      });
    }

    // TENANT ISOLATION: Verify user can access this form
    const user = await User.findById(userId);
    const hasAccess = user.assignedForms.some(id => id.toString() === formId.toString());
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to submit this form.",
      });
    }

    // Create submission
    const submission = new FormSubmission({
      formId,
      userId,
      adminId: user.adminId, // TENANT ISOLATION: Record which admin owns this submission
      answers,
      submissionStatus: "submitted",
    });

    await submission.save();

    // Increment submission count
    form.submission_count = (form.submission_count || 0) + 1;
    await form.save();

    return res.status(201).json({
      success: true,
      message: "Form submitted successfully.",
      submission,
    });
  } catch (error) {
    console.error("Submit form error:", error);
    return res.status(500).json({
      success: false,
      message: "Error submitting form.",
      error: error.message,
    });
  }
};

/**
 * Submit public form (no auth required)
 */
export const submitPublicForm = async (req, res) => {
  try {
    const { publicFormToken, answers, email } = req.body;

    if (!publicFormToken || !answers) {
      return res.status(400).json({
        success: false,
        message: "Form token and answers are required.",
      });
    }

    // Get form
    const form = await Form.findOne({ publicFormToken, isPublished: true });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found or not published.",
      });
    }

    // Check submission limit
    if (form.publicFormSettings.submissionLimit) {
      const submissionCount = await FormSubmission.countDocuments({ formId: form._id });
      if (submissionCount >= form.publicFormSettings.submissionLimit) {
        return res.status(400).json({
          success: false,
          message: "This form has reached its submission limit.",
        });
      }
    }

    // Find or create user for public submission
    let user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      user = new User({
        username: email.split("@")[0] + "_" + Date.now(),
        email: email?.toLowerCase(),
        adminId: form.createdByAdminId,
        role: "USER",
        assignedForms: [form._id],
      });
      await user.save();
    }

    // Create submission
    const submission = new FormSubmission({
      formId: form._id,
      userId: user._id,
      adminId: form.createdByAdminId,
      answers,
      submissionStatus: "submitted",
    });

    await submission.save();

    // Increment submission count
    form.submission_count = (form.submission_count || 0) + 1;
    await form.save();

    return res.status(201).json({
      success: true,
      message: "Form submitted successfully.",
      submission,
    });
  } catch (error) {
    console.error("Submit public form error:", error);
    return res.status(500).json({
      success: false,
      message: "Error submitting form.",
      error: error.message,
    });
  }
};

/**
 * Get user's own submissions (TENANT ISOLATION)
 */
export const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.user.id;

    const submissions = await FormSubmission.find({ userId })
      .populate("formId", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Your submissions retrieved successfully.",
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Get user submissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving submissions.",
      error: error.message,
    });
  }
};

/**
 * Get a specific submission (USER can only see their own)
 */
export const getUserSubmission = async (req, res) => {
  try {
    const userId = req.user.id;
    const { submissionId } = req.params;

    const submission = await FormSubmission.findById(submissionId)
      .populate("formId", "title fields")
      .populate("userId", "username email");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found.",
      });
    }

    // TENANT ISOLATION: Verify user is viewing their own submission
    if (submission.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own submissions.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Submission retrieved successfully.",
      submission,
    });
  } catch (error) {
    console.error("Get user submission error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving submission.",
      error: error.message,
    });
  }
};
