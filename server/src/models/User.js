import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    passwordHash: { type: String, required: true },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
    lastAssessmentAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model("User", userSchema);
