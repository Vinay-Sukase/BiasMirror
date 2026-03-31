import mongoose from "mongoose";

const scoreMapSchema = new mongoose.Schema(
  {
    confirmation: Number,
    anchoring: Number,
    negativity: Number
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress"
    },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    responseTimes: { type: mongoose.Schema.Types.Mixed, default: {} },
    selfPerceptionScores: { type: scoreMapSchema, default: {} },
    scenarioScores: { type: scoreMapSchema, default: {} },
    traitScores: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    behavioralFeatures: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    mlInsights: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    analytics: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    confidenceComponents: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    modelVersion: { type: String, default: null },
    submittedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const AssessmentSession = mongoose.model("AssessmentSession", sessionSchema);
