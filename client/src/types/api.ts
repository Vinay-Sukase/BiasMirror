import type { AssessmentDefinition } from "@biasmirror/shared";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface AssessmentSessionResponse {
  sessionId: string;
}

export interface AssessmentSessionStatusResponse {
  sessionId: string;
  status: "in_progress" | "completed";
  createdAt: string;
  submittedAt: string | null;
}

export interface MlInsights {
  confirmation_bias_score: number;
  anchoring_bias_score: number;
  negativity_bias_score: number;
  confidence: number;
  response_completeness: number;
  timing_quality: number;
  explanation: Record<string, string>;
  trait_scores: Record<string, number>;
  behavioral_features: Record<string, number>;
  model_version: string;
  disclaimer: string;
}

export interface ResultSummary {
  overallTakeaway: string;
  strongestBias: "confirmation" | "anchoring" | "negativity";
  strongestBiasLabel: string;
  strongestBiasExplanation: string;
  biasCards: Array<{
    bias: "confirmation" | "anchoring" | "negativity";
    label: string;
    level: "Low" | "Noticeable" | "Strong";
    plainExplanation: string;
    dailyLifeExample: string;
    watchout: string;
  }>;
  topTakeaways: string[];
  nextStep: string;
  confidencePlainLanguage: string;
}

export interface AssessmentSubmissionResponse {
  sessionId: string;
  selfPerceptionScores: Record<string, number>;
  scenarioScores: Record<string, number>;
  traitScores: Record<string, { raw: number; normalized: number }>;
  behavioralFeatures: Record<string, number>;
  mlInsights: MlInsights;
  resultSummary: ResultSummary;
  analytics: {
    finalBiasScores: Record<string, number>;
    gapAnalysis: Record<string, number>;
    biasStrengthIndex: number;
    consistencyScore: number;
    confidenceScore: number;
    biasLevels: Record<string, string>;
  };
  narratives: {
    headline: string;
    insights: string[];
    reflectionPrompts: string[];
    coachingTip: string;
    disclaimer: string;
    gapNarrative: string;
    resultSummary: ResultSummary;
  };
}

export interface OverviewResponse {
  latestSnapshot: {
    finalBiasScores: Record<string, number>;
    selfPerceptionScores: Record<string, number>;
    scenarioScores: Record<string, number>;
    confidenceScore: number;
    biasStrengthIndex: number;
    consistencyScore: number;
    resultSummary: ResultSummary;
    insights: string[];
    reflectionPrompts: string[];
    coachingTip: string;
    disclaimer?: string;
    createdAt: string;
  } | null;
  sessionCount: number;
}

export interface TrendsResponse {
  range: string;
  points: Array<Record<string, string | number>>;
}

export interface HistoryResponse {
  entries: Array<{
    _id: string;
    finalBiasScores: Record<string, number>;
    confidenceScore: number;
    biasStrengthIndex: number;
    insights: string[];
    reflectionPrompts: string[];
    createdAt: string;
  }>;
}

export interface AdminOverviewResponse {
  counts: {
    users: number;
    admins: number;
    sessions: number;
    completedSessions: number;
    inProgressSessions: number;
  };
  capabilitySuggestions: string[];
}

export interface AdminUsersResponse {
  users: Array<{
    _id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    createdAt: string;
    lastAssessmentAt: string | null;
    sessionCount: number;
  }>;
}

export interface AdminSessionsResponse {
  sessions: Array<{
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      role: "user" | "admin";
    };
    status: string;
    modelVersion: string | null;
    createdAt: string;
    submittedAt: string | null;
  }>;
}

export type AssessmentDefinitionResponse = AssessmentDefinition;
