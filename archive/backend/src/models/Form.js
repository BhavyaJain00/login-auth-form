import mongoose from "mongoose";

const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: "Untitled Form",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    // TENANT ISOLATION: Form belongs to a specific admin (tenant)
    createdByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    // Form fields structure
    fields: [
      {
        id: { type: String, required: true },
        type: { type: String, required: true }, // text, email, number, textarea, checkbox, radio, select, date
        label: { type: String, default: "" },
        placeholder: { type: String, default: "" },
        options: { type: [String], default: [] }, // For select/checkbox/radio options
        required: { type: Boolean, default: false },
        defaultValue: { type: String, default: "" },
        min: { type: Number, default: undefined },
        max: { type: Number, default: undefined },
        minLength: { type: Number, default: undefined },
        maxLength: { type: Number, default: undefined },
        minDate: { type: String, default: undefined },
        maxDate: { type: String, default: undefined },
        pattern: { type: String, default: undefined },
      },
    ],
    // Users assigned to fill this form
    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Public form sharing
    isPublished: {
      type: Boolean,
      default: false,
    },
    publicFormToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Access control for public forms
    publicFormSettings: {
      allowMultipleSubmissions: {
        type: Boolean,
        default: false,
      },
      submissionLimit: {
        type: Number,
        default: null, // null = unlimited
      },
    },
    submission_count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index for tenant isolation queries
formSchema.index({ createdByAdminId: 1, _id: 1 });

export default mongoose.model("Form", formSchema);
