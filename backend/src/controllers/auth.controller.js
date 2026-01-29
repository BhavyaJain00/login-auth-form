import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Form from "../models/Form.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production";
const JWT_EXPIRY = "7d";

/**
 * ADMIN REGISTRATION
 * On first signup, user becomes ADMIN (tenant owner)
 * Multiple ADMINs can exist independently with their own tenants
 */
export const adminSignup = async (req, res) => {
  try {
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

    // Check if email/username already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Email or username already registered as ADMIN.",
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: "ADMIN",
    });

    await newAdmin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully.",
      token,
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Admin signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during signup.",
      error: error.message,
    });
  }
};

/**
 * ADMIN LOGIN
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find admin and select password for comparison
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+passwordHash");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Compare password
    const passwordMatch = await admin.comparePassword(password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully.",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login.",
      error: error.message,
    });
  }
};

/**
 * USER LOGIN
 */
export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find user and select password for comparison
    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+passwordHash")
      .populate("adminId", "username email");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Compare password
    const passwordMatch = await user.comparePassword(password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        adminId: user.adminId._id,
        assignedForms: user.assignedForms,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.status(200).json({
      success: true,
      message: "User logged in successfully.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        adminId: user.adminId._id,
      },
    });
  } catch (error) {
    console.error("User login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login.",
      error: error.message,
    });
  }
};

/**
 * PUBLIC FORM LOGIN
 * When a non-logged-in user opens a public form link
 * After login, user is attached to that form's admin
 */
export const publicFormLogin = async (req, res) => {
  try {
    const { email, password, publicFormToken } = req.body;

    if (!email || !password || !publicFormToken) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and form token are required.",
      });
    }

    // Find the form to get admin
    const form = await Form.findOne({ publicFormToken });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Invalid form token.",
      });
    }

    // Find or create user with this email
    let user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");

    if (!user) {
      // Create new user attached to this form's admin
      user = new User({
        username: email.split("@")[0] + "_" + Date.now(),
        email: email.toLowerCase(),
        passwordHash: password,
        adminId: form.createdByAdminId,
        role: "USER",
        assignedForms: [form._id],
      });

      await user.save();
    } else {
      // User exists - verify password and add form to assigned forms if not already
      const passwordMatch = await user.comparePassword(password);

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      // Add form to assigned forms if not already assigned
      if (!user.assignedForms.includes(form._id)) {
        user.assignedForms.push(form._id);
        await user.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        adminId: user.adminId._id,
        assignedForms: user.assignedForms,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.status(200).json({
      success: true,
      message: "User logged in successfully.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        adminId: user.adminId._id,
      },
    });
  } catch (error) {
    console.error("Public form login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during public form login.",
      error: error.message,
    });
  }
};

