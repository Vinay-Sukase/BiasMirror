export type BiasKey = "confirmation" | "anchoring" | "negativity";
export type TraitKey = "EXT" | "EST" | "AGR" | "CSN" | "OPN";

export interface AssessmentItem {
  id: string;
  section: "self_perception" | "scenarios" | "personality";
  bias?: BiasKey;
  prompt: string;
  scale?: number[];
  options?: Array<{ value: number; label: string }>;
  weights?: Record<number, number>;
}

export interface AssessmentSection {
  id: "self_perception" | "scenarios" | "personality";
  title: string;
  description: string;
  items: AssessmentItem[];
}

export interface AssessmentDefinition {
  version: string;
  title: string;
  disclaimer: string;
  biasLabels: Record<BiasKey, string>;
  sections: AssessmentSection[];
}

export const assessmentDefinition: AssessmentDefinition;
export const personalityReverseKeyMap: Record<TraitKey, string[]>;
export const personalityTraitGroups: Record<TraitKey, string[]>;
export const biasOrder: BiasKey[];
export const syntheticBiasFormulas: Record<BiasKey, string>;
export const analyticsWeights: {
  finalBiasScore: { ml: number; scenario: number; selfPerception: number };
  gapAnalysis: { ml: number; scenario: number };
  confidenceScore: { model: number; completeness: number; timing: number };
};
export const disclaimers: {
  synthetic: string;
};
