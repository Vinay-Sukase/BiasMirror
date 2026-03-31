import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSession",
      required: true,
      index: true
    },
    finalBiasScores: { type: mongoose.Schema.Types.Mixed, required: true },
    selfPerceptionScores: { type: mongoose.Schema.Types.Mixed, required: true },
    scenarioScores: { type: mongoose.Schema.Types.Mixed, required: true },
    mlScores: { type: mongoose.Schema.Types.Mixed, required: true },
    gapAnalysis: { type: mongoose.Schema.Types.Mixed, required: true },
    biasStrengthIndex: { type: Number, required: true },
    consistencyScore: { type: Number, required: true },
    confidenceScore: { type: Number, required: true },
    resultSummary: { type: mongoose.Schema.Types.Mixed, default: null },
    reflectionPrompts: { type: [String], default: [] },
    insights: { type: [String], default: [] },
    coachingTip: { type: String, default: "" },
    disclaimer: { type: String, required: true },
    modelVersion: { type: String, default: null }
  },
  { timestamps: true }
);

export const BiasProfileSnapshot = mongoose.model("BiasProfileSnapshot", snapshotSchema);
