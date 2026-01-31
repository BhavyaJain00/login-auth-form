import mongoose from "mongoose";

const formSubmissionSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // TENANT ISOLATION: Submission belongs to the admin who owns the form
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    // Form submission data as key-value pairs
    answers: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // Metadata
    ipAddress: String,
    userAgent: String,
    submissionStatus: {
      type: String,
      enum: ["draft", "submitted"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

// Compound index for efficient tenant-scoped queries
formSubmissionSchema.index({ adminId: 1, formId: 1 });
formSubmissionSchema.index({ adminId: 1, userId: 1 });

export default mongoose.model("FormSubmission", formSubmissionSchema);
