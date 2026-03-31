import axios from "axios";
import { analyticsWeights, biasOrder, disclaimers } from "@biasmirror/shared";
import { env } from "../config/env.js";
import { BiasProfileSnapshot } from "../models/BiasProfileSnapshot.js";
import { ModelVersion } from "../models/ModelVersion.js";
import { buildMlPayload, computeBehavioralFeatures, scorePersonality, summarizeBiasLevels } from "./scoringEngine.js";
import { generateInsights } from "./insightGenerator.js";

function round(value) {
  return Number(value.toFixed(4));
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function requestMlPrediction(answers, responseTimes) {
  const payload = buildMlPayload(answers, responseTimes);
  try {
    const response = await axios.post(`${env.ML_SERVICE_URL}/ml/predict`, payload, {
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    const details = error.response?.data ?? error.message;
    const wrappedError = new Error("ML prediction failed");
    wrappedError.statusCode = 502;
    wrappedError.details = details;
    throw wrappedError;
  }
}

export function computeAnalytics({ selfPerceptionScores, scenarioScores, mlInsights }) {
  const finalBiasScores = {};
  const gapAnalysis = {};

  for (const bias of biasOrder) {
    finalBiasScores[bias] = round(
      analyticsWeights.finalBiasScore.ml * mlInsights[`${bias}_bias_score`] +
        analyticsWeights.finalBiasScore.scenario * scenarioScores[bias] +
        analyticsWeights.finalBiasScore.selfPerception * selfPerceptionScores[bias]
    );

    gapAnalysis[bias] = round(
      selfPerceptionScores[bias] -
        (analyticsWeights.gapAnalysis.ml * mlInsights[`${bias}_bias_score`] +
          analyticsWeights.gapAnalysis.scenario * scenarioScores[bias])
    );
  }

  const finalValues = Object.values(finalBiasScores);
  const consistencyValues = biasOrder.map((bias) => {
    const ml = mlInsights[`${bias}_bias_score`];
    const scenario = scenarioScores[bias];
    const self = selfPerceptionScores[bias];
    return mean([Math.abs(ml - scenario), Math.abs(ml - self), Math.abs(scenario - self)]);
  });

  const confidenceScore = round(
    analyticsWeights.confidenceScore.model * mlInsights.confidence +
      analyticsWeights.confidenceScore.completeness * mlInsights.response_completeness +
      analyticsWeights.confidenceScore.timing * mlInsights.timing_quality
  );

  return {
    finalBiasScores,
    gapAnalysis,
    biasStrengthIndex: round(mean(finalValues) * 100),
    consistencyScore: round(1 - mean(consistencyValues)),
    confidenceScore,
    biasLevels: summarizeBiasLevels(finalBiasScores)
  };
}

export async function persistSnapshot({
  userId,
  sessionId,
  selfPerceptionScores,
  scenarioScores,
  mlInsights,
  analytics,
  trendDelta
}) {
  const narratives = generateInsights({
    finalBiasScores: analytics.finalBiasScores,
    gapAnalysis: analytics.gapAnalysis,
    consistencyScore: analytics.consistencyScore,
    confidenceScore: analytics.confidenceScore,
    trendDelta
  });

  await BiasProfileSnapshot.create({
    userId,
    sessionId,
    finalBiasScores: analytics.finalBiasScores,
    selfPerceptionScores,
    scenarioScores,
    mlScores: {
      confirmation: mlInsights.confirmation_bias_score,
      anchoring: mlInsights.anchoring_bias_score,
      negativity: mlInsights.negativity_bias_score
    },
    gapAnalysis: analytics.gapAnalysis,
    biasStrengthIndex: analytics.biasStrengthIndex,
    consistencyScore: analytics.consistencyScore,
    confidenceScore: analytics.confidenceScore,
    resultSummary: narratives.resultSummary,
    reflectionPrompts: narratives.reflectionPrompts,
    insights: narratives.insights,
    coachingTip: narratives.coachingTip,
    disclaimer: disclaimers.synthetic,
    modelVersion: mlInsights.model_version
  });

  await ModelVersion.updateOne(
    { version: mlInsights.model_version },
    {
      $setOnInsert: {
        version: mlInsights.model_version,
        metrics: mlInsights.model_metrics || {},
        limitations: disclaimers.synthetic,
        artifactPath: mlInsights.artifact_path || "",
        featureImportanceTop: mlInsights.feature_importance_top || [],
        trainedAt: new Date()
      }
    },
    { upsert: true }
  );

  return narratives;
}

export async function analyzeSubmission({
  userId,
  sessionId,
  answers,
  responseTimes,
  selfPerceptionScores,
  scenarioScores
}) {
  const mlInsights = await requestMlPrediction(answers, responseTimes);
  const analytics = computeAnalytics({ selfPerceptionScores, scenarioScores, mlInsights });
  const traitScores = scorePersonality(buildMlPayload(answers, responseTimes).answers);
  const behavioralFeatures = computeBehavioralFeatures(responseTimes);
  const narratives = await persistSnapshot({
    userId,
    sessionId,
    selfPerceptionScores,
    scenarioScores,
    mlInsights,
    analytics
  });

  return {
    traitScores,
    behavioralFeatures,
    mlInsights,
    analytics,
    narratives
  };
}
