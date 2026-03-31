import {
  assessmentDefinition,
  biasOrder,
  personalityReverseKeyMap,
  personalityTraitGroups
} from "@biasmirror/shared";

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values) {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  return mean(values.map((value) => (value - avg) ** 2));
}

export function normalizeLikert(value) {
  return clamp((value - 1) / 4);
}

export function scoreSelfPerception(answers) {
  const items = assessmentDefinition.sections.find((section) => section.id === "self_perception").items;
  return biasOrder.reduce((result, bias) => {
    const biasItems = items.filter((item) => item.bias === bias);
    result[bias] = clamp(mean(biasItems.map((item) => normalizeLikert(answers[item.id] ?? 3))));
    return result;
  }, {});
}

export function scoreScenarios(answers) {
  const items = assessmentDefinition.sections.find((section) => section.id === "scenarios").items;
  return biasOrder.reduce((result, bias) => {
    const biasItems = items.filter((item) => item.bias === bias);
    result[bias] = clamp(
      mean(
        biasItems.map((item) => {
          const value = answers[item.id] ?? 3;
          return item.weights?.[value] ?? normalizeLikert(value);
        })
      )
    );
    return result;
  }, {});
}

export function reverseScoreIfNeeded(itemId, value) {
  const trait = itemId.slice(0, 3);
  const shouldReverse = personalityReverseKeyMap[trait]?.includes(itemId);
  return shouldReverse ? 6 - value : value;
}

export function scorePersonality(answers) {
  const keyedAnswers = Object.entries(answers).reduce((result, [itemId, value]) => {
    result[itemId] = reverseScoreIfNeeded(itemId, value);
    return result;
  }, {});

  const traitScores = Object.entries(personalityTraitGroups).reduce((result, [trait, itemIds]) => {
    const values = itemIds
      .map((itemId) => keyedAnswers[itemId])
      .filter((value) => typeof value === "number" && value >= 1 && value <= 5);
    const rawMean = mean(values);
    result[trait] = {
      raw: Number(rawMean.toFixed(3)),
      normalized: Number(normalizeLikert(rawMean).toFixed(3))
    };
    return result;
  }, {});

  return traitScores;
}

export function computeBehavioralFeatures(responseTimes) {
  const values = Object.values(responseTimes)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  const avgResponseTime = mean(values);
  const responseVariance = variance(values);
  const sorted = [...values].sort((a, b) => a - b);
  const median =
    sorted.length === 0
      ? 0
      : sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
  const fast = values.filter((value) => value <= median).length;
  const slow = values.filter((value) => value > median).length;

  return {
    avg_response_time: Number(avgResponseTime.toFixed(3)),
    response_variance: Number(responseVariance.toFixed(3)),
    fast_vs_slow_ratio: Number((((fast + 1) / (slow + 1)) || 0).toFixed(3)),
    response_completeness: Number((values.length / 50).toFixed(3))
  };
}

export function splitAnswersBySection(answers) {
  const sectionMap = {
    self_perception: {},
    scenarios: {},
    personality: {}
  };

  for (const section of assessmentDefinition.sections) {
    for (const item of section.items) {
      if (answers[item.id] !== undefined) {
        sectionMap[section.id][item.id] = Number(answers[item.id]);
      }
    }
  }

  return sectionMap;
}

export function buildMlPayload(answers, responseTimes) {
  const { personality } = splitAnswersBySection(answers);
  const personalityResponseTimes = Object.fromEntries(
    Object.entries(responseTimes)
      .filter(([key]) => key in personality)
      .map(([key, value]) => [`${key}_E`, value])
  );
  return {
    answers: personality,
    response_times: personalityResponseTimes
  };
}

export function summarizeBiasLevels(scores) {
  return Object.fromEntries(
    Object.entries(scores).map(([bias, score]) => {
      const label = score >= 0.75 ? "High" : score >= 0.45 ? "Moderate" : "Low";
      return [bias, label];
    })
  );
}
