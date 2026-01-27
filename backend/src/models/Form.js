import mongoose from "mongoose";

const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: "Untitled Form"
    },
    description: {
      type: String,
      default: ""
    },
    fields: [
      {
        id: { type: String, required: true },
        type: { type: String, required: true },
        label: { type: String, default: "" },
        placeholder: { type: String, default: "" },
        options: { type: [String], default: [] }, // For select/checkbox options
        required: { type: Boolean, default: false },
        defaultValue: { type: String, default: "" },
        min: { type: Number, default: undefined },
        max: { type: Number, default: undefined },
        minLength: { type: Number, default: undefined },
        maxLength: { type: Number, default: undefined },
        minDate: { type: String, default: undefined },
        maxDate: { type: String, default: undefined },
        pattern: { type: String, default: undefined }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Form", formSchema);
