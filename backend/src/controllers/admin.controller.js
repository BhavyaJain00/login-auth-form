import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Form from "../models/Form.js";
import FormSubmission from "../models/FormSubmission.js";
import { v4 as uuidv4 } from "uuid";

/**
 * ADMIN USER MANAGEMENT
 * =====================
 * ADMINs can only manage users belonging to their tenant
 */

/**
 * Get all users for the current admin (TENANT ISOLATION)
 */
export const getAdminUsers = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Query: Only get users belonging to this admin
    const users = await User.find({ adminId })
      .select("-passwordHash")
      .populate("adminId", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving users.",
      error: error.message,
    });
  }
};

/**
 * Create a new user in the admin's tenant
 * Only ADMIN can create users (users cannot self-register)
 */
export const createUser = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { username, email, password, passwordConfirm } = req.body;

    // Validation
    if (!username || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Check if user already exists in this admin's tenant
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
      adminId,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email or username already exists in your tenant.",
      });
    }

    // Create new user
    const newUser = new User({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: "USER",
      adminId,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        adminId: newUser.adminId,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating user.",
      error: error.message,
    });
  }
};

/**
 * Delete a user from the admin's tenant (TENANT ISOLATION)
 */
export const deleteUser = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;

    // TENANT ISOLATION: Verify user belongs to this admin
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.adminId.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: "This user belongs to another admin tenant.",
      });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting user.",
      error: error.message,
    });
  }
};

/**
 * ADMIN FORM MANAGEMENT
 * =====================
 * ADMINs can only manage forms they created
 */

/**
 * Get all forms for the current admin (TENANT ISOLATION)
 */
export const getAdminForms = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Query: Only get forms created by this admin
    const forms = await Form.find({ createdByAdminId: adminId })
      .populate("assignedUsers", "_id username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Forms retrieved successfully.",
      count: forms.length,
      forms,
    });
  } catch (error) {
    console.error("Get admin forms error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving forms.",
      error: error.message,
    });
  }
};

/**
 * Get a single form by ID for editing (TENANT ISOLATION)
 */
export const getAdminFormById = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { formId } = req.params;

    // Query: Only get form if it belongs to this admin
    const form = await Form.findById(formId)
      .populate("assignedUsers", "_id username email");

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found.",
      });
    }

    // TENANT ISOLATION: Verify form belongs to this admin
    if (form.createdByAdminId.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: "This form belongs to another admin tenant.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Form retrieved successfully.",
      form,
    });
  } catch (error) {
    console.error("Get admin form by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving form.",
      error: error.message,
    });
  }
};

/**
 * Create a new form
 */
export const createForm = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { title, description, fields } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Form title is required.",
      });
    }

    const newForm = new Form({
      title: title.trim(),
      description: description || "",
      createdByAdminId: adminId,
      fields: fields || [],
      assignedUsers: [],
      isPublished: false,
    });

    await newForm.save();

    return res.status(201).json({
      success: true,
      message: "Form created successfully.",
      form: newForm,
    });
  } catch (error) {
    console.error("Create form error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating form.",
      error: error.message,
    });
  }
};

/**
 * Update a form (TENANT ISOLATION)
 */
export const updateForm = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { formId } = req.params;
    const { title, description, fields, assignedUsers } = req.body;

    // TENANT ISOLATION: Verify form belongs to this admin
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found.",
      });
    }

    if (form.createdByAdminId.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: "This form belongs to another admin tenant.",
      });
    }

    // Update form
    if (title) form.title = title.trim();
    if (description !== undefined) form.description = description;
    if (fields) form.fields = fields;
    if (assignedUsers) form.assignedUsers = assignedUsers;

    await form.save();

    return res.status(200).json({
      success: true,
      message: "Form updated successfully.",
      form,
    });
  } catch (error) {
    console.error("Update form error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating form.",
      error: error.message,
    });
  }
};

/**
 * Delete a form (TENANT ISOLATION)
 */
export const deleteForm = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { formId } = req.params;

    // TENANT ISOLATION: Verify form belongs to this admin
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found.",
      });
    }

    if (form.createdByAdminId.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: "This form belongs to another admin tenant.",
      });
    }

    // Delete form and its submissions
    await Form.findByIdAndDelete(formId);
    await FormSubmission.deleteMany({ formId });

    return res.status(200).json({
      success: true,
      message: "Form deleted successfully.",
    });
  } catch (error) {
    console.error("Delete form error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting form.",
      error: error.message,
    });
  }
};

/**
 * Publish a form and generate public link
 */
export const publishForm = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { formId } = req.params;

    // TENANT ISOLATION: Verify form belongs to this admin
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found.",
      });
    }

    if (form.createdByAdminId.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: "This form belongs to another admin tenant.",
      });
    }

    // Generate public token if not already published
    if (!form.publicFormToken) {
      form.publicFormToken = uuidv4();
    }

    form.isPublished = true;
    await form.save();

    return res.status(200).json({
      success: true,
      message: "Form published successfully.",
      form,
      publicLink: `${process.env.FRONTEND_URL}/form/${form.publicFormToken}`,
    });
  } catch (error) {
    console.error("Publish form error:", error);
    return res.status(500).json({
      success: false,
      message: "Error publishing form.",
      error: error.message,
    });
  }
};

/**
 * Assign users to a form (TENANT ISOLATION)
 */
export const assignUsersToForm = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { formId } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: "userIds must be an array.",
      });
    }

    // TENANT ISOLATION: Verify form belongs to this admin
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found.",
      });
    }

    if (form.createdByAdminId.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: "This form belongs to another admin tenant.",
      });
    }

    // Verify all users belong to this admin
    const users = await User.find({ _id: { $in: userIds }, adminId });

    if (users.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some users do not belong to your tenant.",
      });
    }

    // Assign form to users
    form.assignedUsers = userIds;
    await form.save();

    // Also add form to each user's assignedForms
    await User.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { assignedForms: formId } }
    );

    return res.status(200).json({
      success: true,
      message: "Users assigned to form successfully.",
      form,
    });
  } catch (error) {
    console.error("Assign users to form error:", error);
    return res.status(500).json({
      success: false,
      message: "Error assigning users to form.",
      error: error.message,
    });
  }
};

/**
 * ADMIN SUBMISSIONS MANAGEMENT
 * ============================
 * ADMINs can view all submissions for their forms only
 */

/**
 * Get all submissions for admin's forms (TENANT ISOLATION)
 */
export const getAdminSubmissions = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Query: Only get submissions where adminId matches
    const submissions = await FormSubmission.find({ adminId })
      .populate("formId", "title")
      .populate("userId", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Submissions retrieved successfully.",
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Get admin submissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving submissions.",
      error: error.message,
    });
  }
};

/**
 * Get submissions for a specific form (TENANT ISOLATION)
 */
export const getFormSubmissions = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { formId } = req.params;

    // TENANT ISOLATION: Verify form belongs to this admin
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found.",
      });
    }

    if (form.createdByAdminId.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: "This form belongs to another admin tenant.",
      });
    }

    // Get submissions for this form
    const submissions = await FormSubmission.find({ formId, adminId })
      .populate("userId", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Form submissions retrieved successfully.",
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Get form submissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving form submissions.",
      error: error.message,
    });
  }
};

/**
 * Get submissions for a specific user (TENANT ISOLATION)
 */
export const getUserSubmissions = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;

    // TENANT ISOLATION: Verify user belongs to this admin
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.adminId.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: "This user belongs to another admin tenant.",
      });
    }

    // Get submissions for this user
    const submissions = await FormSubmission.find({ userId, adminId })
      .populate("formId", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "User submissions retrieved successfully.",
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Get user submissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving user submissions.",
      error: error.message,
    });
  }
};
