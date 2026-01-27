import Form from "../models/Form.js";
import FormSubmission from "../models/FormSubmission.js";

// Save or update a form
export const saveForm = async (req, res) => {
  try {
    const { title, description } = req.body;
    let { fields } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Some clients may accidentally send fields as a JSON string (or as [ "<json>" ]).
    // Normalize to an array of field objects.
    if (typeof fields === "string") {
      try {
        fields = JSON.parse(fields);
      } catch {
        return res.status(400).json({ message: "Invalid fields JSON" });
      }
    }
    if (Array.isArray(fields) && fields.length === 1 && typeof fields[0] === "string") {
      try {
        const parsed = JSON.parse(fields[0]);
        if (Array.isArray(parsed)) fields = parsed;
      } catch {
        // ignore; validation below will catch it
      }
    }
    if (!fields || !Array.isArray(fields)) {
      return res.status(400).json({ message: "Fields array is required" });
    }
    // Normalize each field object
    fields = fields.map((f) => {
      if (typeof f === "string") {
        try {
          f = JSON.parse(f);
        } catch {
          return null;
        }
      }
      if (!f || typeof f !== "object" || Array.isArray(f)) {
        return null;
      }
      // Ensure required fields exist and normalize structure
      return {
        id: f.id || `f_${Date.now()}_${Math.random()}`,
        type: f.type || "text",
        label: f.label || "",
        placeholder: f.placeholder || "",
        options: Array.isArray(f.options) ? f.options : [],
        required: f.required === true,
        defaultValue: f.defaultValue || "",
        min: f.min !== undefined && f.min !== null && f.min !== "" ? Number(f.min) : undefined,
        max: f.max !== undefined && f.max !== null && f.max !== "" ? Number(f.max) : undefined,
        minLength: f.minLength !== undefined && f.minLength !== null && f.minLength !== "" ? Number(f.minLength) : undefined,
        maxLength: f.maxLength !== undefined && f.maxLength !== null && f.maxLength !== "" ? Number(f.maxLength) : undefined,
        minDate: f.minDate || undefined,
        maxDate: f.maxDate || undefined,
        pattern: f.pattern || undefined
      };
    }).filter(Boolean); // Remove any null/invalid fields
    
    if (fields.length === 0) {
      return res.status(400).json({ message: "At least one valid field is required" });
    }

    const formData = {
      title: title || "Untitled Form",
      description: description || "",
      fields,
      createdBy: userId
    };

    // If formId is provided, update existing form
    if (req.body.formId) {
      const form = await Form.findOneAndUpdate(
        { _id: req.body.formId, createdBy: userId },
        formData,
        { new: true }
      );
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      return res.json(form);
    }

    // Otherwise, create new form
    const form = new Form(formData);
    await form.save();
    res.status(201).json(form);
  } catch (error) {
    console.error("Save form error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      body: req.body
    });
    res.status(500).json({ 
      message: error.message || "Failed to save form",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// Get all forms for the current user
export const getMyForms = async (req, res) => {
  try {
    const userId = req.userId;
    const forms = await Form.find({ createdBy: userId }).sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single form by ID
export const getForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a form
export const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const form = await Form.findOneAndDelete({ _id: id, createdBy: userId });
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
    // Also delete all submissions for this form
    await FormSubmission.deleteMany({ formId: id });
    res.json({ message: "Form deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit form data
export const submitForm = async (req, res) => {
  try {
    const { formId, data } = req.body;
    const userId = req.userId;

    if (!formId || !data) {
      return res.status(400).json({ message: "Form ID and data are required" });
    }

    // Verify form exists
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const submission = new FormSubmission({
      formId,
      submittedBy: userId,
      data
    });
    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all submissions for a form
export const getFormSubmissions = async (req, res) => {
  try {
    const { formId } = req.params;
    const userId = req.userId;

    // Verify form belongs to user
    const form = await Form.findOne({ _id: formId, createdBy: userId });
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const submissions = await FormSubmission.find({ formId })
      .populate("submittedBy", "name email")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all submissions for current user
export const getMySubmissions = async (req, res) => {
  try {
    const userId = req.userId;
    const submissions = await FormSubmission.find({ submittedBy: userId })
      .populate("formId", "title")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a submission (submitted data) for current user
export const updateMySubmission = async (req, res) => {
  try {
    const userId = req.userId;
    const { submissionId } = req.params;
    const { data } = req.body;

    if (!data || typeof data !== "object") {
      return res.status(400).json({ message: "Submission data is required" });
    }

    const submission = await FormSubmission.findOneAndUpdate(
      { _id: submissionId, submittedBy: userId },
      { data },
      { new: true }
    ).populate("formId", "title");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    return res.json(submission);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
