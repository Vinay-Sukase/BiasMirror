import { BiasProfileSnapshot } from "../models/BiasProfileSnapshot.js";
import { AssessmentSession } from "../models/AssessmentSession.js";
import { buildResultSummary } from "../services/insightGenerator.js";

function getRangeStart(range) {
  const now = new Date();
  const start = new Date(now);
  const days = range === "365d" ? 365 : range === "90d" ? 90 : 30;
  start.setDate(start.getDate() - days);
  return start;
}

export async function getOverview(req, res, next) {
  try {
    const latestSnapshotDoc = await BiasProfileSnapshot.findOne({ userId: req.auth.sub }).sort({
      createdAt: -1
    }).lean();
    const sessionCount = await AssessmentSession.countDocuments({ userId: req.auth.sub });

    const latestSnapshot = latestSnapshotDoc
      ? {
          ...latestSnapshotDoc,
          resultSummary:
            latestSnapshotDoc.resultSummary ??
            buildResultSummary({
              finalBiasScores: latestSnapshotDoc.finalBiasScores,
              confidenceScore: latestSnapshotDoc.confidenceScore,
              consistencyScore: latestSnapshotDoc.consistencyScore
            })
        }
      : null;

    return res.json({
      latestSnapshot,
      sessionCount
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTrends(req, res, next) {
  try {
    const range = ["30d", "90d", "365d"].includes(req.query.range) ? req.query.range : "90d";
    const snapshots = await BiasProfileSnapshot.find({
      userId: req.auth.sub,
      createdAt: { $gte: getRangeStart(range) }
    }).sort({ createdAt: 1 });

    const data = snapshots.map((snapshot) => ({
      date: snapshot.createdAt.toISOString().slice(0, 10),
      confidence: snapshot.confidenceScore,
      biasStrengthIndex: snapshot.biasStrengthIndex,
      ...snapshot.finalBiasScores
    }));

    return res.json({ range, points: data });
  } catch (error) {
    return next(error);
  }
}

export async function getHistory(req, res, next) {
  try {
    const snapshots = await BiasProfileSnapshot.find({ userId: req.auth.sub })
      .sort({ createdAt: -1 })
      .limit(24);
    return res.json({ entries: snapshots });
  } catch (error) {
    return next(error);
  }
}
