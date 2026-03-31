import crypto from "node:crypto";
import { User } from "../models/User.js";
import { AssessmentSession } from "../models/AssessmentSession.js";
import { UserEvent } from "../models/UserEvent.js";
import { BiasProfileSnapshot } from "../models/BiasProfileSnapshot.js";

const capabilitySuggestions = [
  "Suspend or reactivate user access",
  "Export anonymized analytics for research reviews",
  "Inspect model-version usage by session",
  "Flag suspicious or low-quality response sessions",
  "Broadcast assessment updates or maintenance notices"
];

export async function getAdminOverview(_req, res, next) {
  try {
    const [users, admins, sessions, completedSessions, inProgressSessions] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "admin" }),
      AssessmentSession.countDocuments(),
      AssessmentSession.countDocuments({ status: "completed" }),
      AssessmentSession.countDocuments({ status: "in_progress" })
    ]);

    return res.json({
      counts: {
        users,
        admins,
        sessions,
        completedSessions,
        inProgressSessions
      },
      capabilitySuggestions
    });
  } catch (error) {
    return next(error);
  }
}

export async function listUsers(_req, res, next) {
  try {
    const users = await User.find()
      .select("name email role createdAt lastAssessmentAt")
      .sort({ createdAt: -1 })
      .lean();

    const sessionCounts = await AssessmentSession.aggregate([
      {
        $group: {
          _id: "$userId",
          sessionCount: { $sum: 1 }
        }
      }
    ]);

    const sessionCountMap = new Map(sessionCounts.map((entry) => [String(entry._id), entry.sessionCount]));

    return res.json({
      users: users.map((user) => ({
        ...user,
        sessionCount: sessionCountMap.get(String(user._id)) ?? 0
      }))
    });
  } catch (error) {
    return next(error);
  }
}

export async function listSessions(_req, res, next) {
  try {
    const sessions = await AssessmentSession.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ sessions });
  } catch (error) {
    return next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const sessionIds = await AssessmentSession.find({ userId: user.id }).distinct("_id");
    await Promise.all([
      AssessmentSession.deleteMany({ userId: user.id }),
      UserEvent.deleteMany({ userId: user.id }),
      BiasProfileSnapshot.deleteMany({ userId: user.id }),
      User.findByIdAndDelete(user.id)
    ]);

    if (sessionIds.length) {
      await Promise.all([
        UserEvent.deleteMany({ sessionId: { $in: sessionIds } }),
        BiasProfileSnapshot.deleteMany({ sessionId: { $in: sessionIds } })
      ]);
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function deleteSession(req, res, next) {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await Promise.all([
      AssessmentSession.findByIdAndDelete(session.id),
      UserEvent.deleteMany({ sessionId: session.id }),
      BiasProfileSnapshot.deleteMany({ sessionId: session.id })
    ]);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function exportResearchAnalytics(_req, res, next) {
  try {
    const snapshots = await BiasProfileSnapshot.find()
      .select(
        "userId sessionId finalBiasScores selfPerceptionScores scenarioScores mlScores gapAnalysis biasStrengthIndex consistencyScore confidenceScore modelVersion createdAt"
      )
      .lean();

    const exportPayload = snapshots.map((snapshot) => ({
      participant_id: crypto.createHash("sha256").update(String(snapshot.userId)).digest("hex").slice(0, 12),
      session_id: String(snapshot.sessionId),
      captured_at: snapshot.createdAt,
      model_version: snapshot.modelVersion,
      final_bias_scores: snapshot.finalBiasScores,
      self_perception_scores: snapshot.selfPerceptionScores,
      scenario_scores: snapshot.scenarioScores,
      ml_scores: snapshot.mlScores,
      gap_analysis: snapshot.gapAnalysis,
      bias_strength_index: snapshot.biasStrengthIndex,
      consistency_score: snapshot.consistencyScore,
      confidence_score: snapshot.confidenceScore
    }));

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="biasmirror-research-export-${new Date().toISOString().slice(0, 10)}.json"`
    );
    return res.status(200).send(JSON.stringify(exportPayload, null, 2));
  } catch (error) {
    return next(error);
  }
}
