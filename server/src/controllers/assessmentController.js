import { assessmentDefinition } from "@biasmirror/shared";
import { z } from "zod";
import { AssessmentSession } from "../models/AssessmentSession.js";
import { UserEvent } from "../models/UserEvent.js";
import { User } from "../models/User.js";
import { analyzeSubmission } from "../services/analysisService.js";
import { scoreScenarios, scoreSelfPerception, splitAnswersBySection } from "../services/scoringEngine.js";

const sessionCreateSchema = z.object({
  source: z.string().optional().default("web")
});

const eventSchema = z.object({
  questionId: z.string(),
  answer: z.number().min(1).max(5),
  responseTime: z.number().positive(),
  timestamp: z.string().datetime()
});

const submitSchema = z.object({
  answers: z.record(z.string(), z.number().min(1).max(5)),
  responseTimes: z.record(z.string(), z.number().nonnegative())
});

export async function getAssessmentDefinition(_req, res) {
  res.json(assessmentDefinition);
}

export async function createAssessmentSession(req, res, next) {
  try {
    sessionCreateSchema.parse(req.body ?? {});
    const session = await AssessmentSession.create({
      userId: req.auth.sub,
      status: "in_progress"
    });
    return res.status(201).json({ sessionId: session.id });
  } catch (error) {
    return next(error);
  }
}

export async function getAssessmentSession(req, res, next) {
  try {
    const session = await AssessmentSession.findOne({
      _id: req.params.id,
      userId: req.auth.sub
    }).select("_id status createdAt submittedAt");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.json({
      sessionId: session.id,
      status: session.status,
      createdAt: session.createdAt,
      submittedAt: session.submittedAt
    });
  } catch (error) {
    return next(error);
  }
}

export async function trackUserEvent(req, res, next) {
  try {
    const payload = eventSchema.parse(req.body);
    const session = await AssessmentSession.findOne({
      _id: req.params.id,
      userId: req.auth.sub
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await UserEvent.create({
      userId: req.auth.sub,
      sessionId: session.id,
      questionId: payload.questionId,
      answer: payload.answer,
      responseTime: payload.responseTime,
      timestamp: new Date(payload.timestamp)
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    return next(error);
  }
}

export async function submitAssessment(req, res, next) {
  try {
    const payload = submitSchema.parse(req.body);
    const session = await AssessmentSession.findOne({
      _id: req.params.id,
      userId: req.auth.sub
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const expectedQuestionCount = assessmentDefinition.sections.reduce(
      (count, section) => count + section.items.length,
      0
    );

    if (Object.keys(payload.answers).length < expectedQuestionCount) {
      return res.status(400).json({ message: "Please complete every assessment question before submitting." });
    }

    const splitAnswers = splitAnswersBySection(payload.answers);
    const selfPerceptionScores = scoreSelfPerception(splitAnswers.self_perception);
    const scenarioScores = scoreScenarios(splitAnswers.scenarios);

    const analysis = await analyzeSubmission({
      userId: req.auth.sub,
      sessionId: session.id,
      answers: payload.answers,
      responseTimes: payload.responseTimes,
      selfPerceptionScores,
      scenarioScores
    });

    session.status = "completed";
    session.answers = payload.answers;
    session.responseTimes = payload.responseTimes;
    session.selfPerceptionScores = selfPerceptionScores;
    session.scenarioScores = scenarioScores;
    session.traitScores = analysis.traitScores;
    session.behavioralFeatures = analysis.behavioralFeatures;
    session.mlInsights = analysis.mlInsights;
    session.analytics = analysis.analytics;
    session.confidenceComponents = {
      model_confidence: analysis.mlInsights.confidence,
      response_completeness: analysis.mlInsights.response_completeness,
      timing_quality: analysis.mlInsights.timing_quality
    };
    session.modelVersion = analysis.mlInsights.model_version;
    session.submittedAt = new Date();
    await session.save();

    await User.findByIdAndUpdate(req.auth.sub, {
      lastAssessmentAt: new Date()
    });

    return res.json({
      sessionId: session.id,
      selfPerceptionScores,
      scenarioScores,
      traitScores: analysis.traitScores,
      behavioralFeatures: analysis.behavioralFeatures,
      mlInsights: analysis.mlInsights,
      analytics: analysis.analytics,
      resultSummary: analysis.narratives.resultSummary,
      narratives: analysis.narratives
    });
  } catch (error) {
    return next(error);
  }
}
