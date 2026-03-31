import mongoose from "mongoose";

const modelVersionSchema = new mongoose.Schema(
  {
    version: { type: String, required: true, unique: true },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    limitations: { type: String, default: "" },
    artifactPath: { type: String, default: "" },
    featureImportanceTop: { type: mongoose.Schema.Types.Mixed, default: [] },
    trainedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ModelVersion = mongoose.model("ModelVersion", modelVersionSchema);
