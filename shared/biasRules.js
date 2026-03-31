export const syntheticBiasFormulas = {
  confirmation:
    "0.50*(1-OPN) + 0.25*(1-AGR) + 0.15*fast_vs_slow_norm + 0.10*(1-response_variance_norm)",
  anchoring:
    "0.40*(1-OPN) + 0.20*(1-EXT) + 0.20*fast_vs_slow_norm + 0.20*(1-response_variance_norm)",
  negativity:
    "0.60*EST + 0.15*(1-EXT) + 0.15*avg_response_time_norm + 0.10*response_variance_norm"
};

export const analyticsWeights = {
  finalBiasScore: {
    ml: 0.55,
    scenario: 0.25,
    selfPerception: 0.2
  },
  gapAnalysis: {
    ml: 0.7,
    scenario: 0.3
  },
  confidenceScore: {
    model: 0.6,
    completeness: 0.2,
    timing: 0.2
  }
};

export const disclaimers = {
  synthetic:
    "Model is based on inferred relationships, not direct ground truth labels."
};
