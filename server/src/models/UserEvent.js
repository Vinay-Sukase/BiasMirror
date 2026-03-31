import mongoose from "mongoose";

const userEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSession",
      required: true,
      index: true
    },
    questionId: { type: String, required: true },
    answer: { type: Number, required: true },
    responseTime: { type: Number, required: true },
    timestamp: { type: Date, required: true }
  },
  { timestamps: true }
);

export const UserEvent = mongoose.model("UserEvent", userEventSchema);
