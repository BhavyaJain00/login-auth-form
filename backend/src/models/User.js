import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    googleId: { type: String },
    picture: { type: String }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;

