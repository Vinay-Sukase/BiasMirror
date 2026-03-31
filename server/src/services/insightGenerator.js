import { biasOrder, disclaimers } from "@biasmirror/shared";

const biasContent = {
  confirmation: {
    label: "Seeking familiar evidence",
    shortLabel: "Confirmation bias",
    plainExplanation:
      "You may feel more comfortable with information that supports what you already believe.",
    dailyLifeExample:
      "This can show up when you revisit reviews, opinions, or advice that support your first choice and spend less time with the opposing view.",
    watchout:
      "This can help you decide faster when your instincts are already well informed, but it can create blind spots when useful counter-evidence is easy to dismiss.",
    nextStep:
      "Before your next important decision, actively look for one credible source that challenges your first view and give it a fair second read."
  },
  anchoring: {
    label: "Holding on to the first number or idea",
    shortLabel: "Anchoring bias",
    plainExplanation:
      "Your first impression, estimate, or suggestion may influence you more than you realize.",
    dailyLifeExample:
      "This can show up when the first price, timeline, or opinion you hear keeps shaping what feels reasonable later on.",
    watchout:
      "This can help you get oriented quickly, but it can also make it harder to fully adjust when better information appears.",
    nextStep:
      "When a first number or idea appears, pause and write down two alternative possibilities before you commit to a decision."
  },
  negativity: {
    label: "Giving extra weight to risks and setbacks",
    shortLabel: "Negativity bias",
    plainExplanation:
      "Difficult outcomes, criticism, or risks may stay louder in your mind than positive signals.",
    dailyLifeExample:
      "This can show up when one setback, warning, or critical comment keeps your attention longer than the progress around it.",
    watchout:
      "This can help you notice risk early, but it can also make setbacks feel bigger than they really are and overshadow what is going well.",
    nextStep:
      "After a meaningful decision or feedback moment, list one risk, one positive sign, and one neutral fact before deciding what it means."
  }
};

function pickPrimaryBias(finalBiasScores) {
  return [...biasOrder].sort((a, b) => finalBiasScores[b] - finalBiasScores[a])[0];
}

function biasLevel(score) {
  if (score >= 0.67) return "Strong";
  if (score >= 0.34) return "Noticeable";
  return "Low";
}

function confidencePlainLanguage(confidenceScore) {
  if (confidenceScore >= 0.8) {
    return "This reading looks fairly steady because your answers formed a clear pattern.";
  }
  if (confidenceScore >= 0.6) {
    return "This reading is reasonably steady, but it may shift as you take the assessment again over time.";
  }
  return "This reading is useful as a starting point, but it should be treated as an early signal rather than a firm conclusion.";
}

function secondaryTakeaway(sortedBiases) {
  const secondary = sortedBiases[1];
  if (!secondary || secondary[1] < 0.34) {
    return "The other two bias areas look lighter right now, which suggests this pattern is more concentrated than broad.";
  }

  return `A secondary pattern is ${biasContent[secondary[0]].label.toLowerCase()}, so it may also influence your decisions in certain situations.`;
}

export function buildResultSummary({
  finalBiasScores,
  confidenceScore,
  consistencyScore
}) {
  const sortedBiases = [...biasOrder]
    .map((bias) => [bias, finalBiasScores[bias] ?? 0])
    .sort((a, b) => b[1] - a[1]);

  const strongestBias = sortedBiases[0][0];
  const strongestScore = sortedBiases[0][1];
  const strongestMeta = biasContent[strongestBias];
  const strongestLevel = biasLevel(strongestScore);

  const overallTakeaway =
    strongestLevel === "Low"
      ? `Your assessment does not point to one strongly dominant bias right now. The clearest signal is a lighter tendency toward ${strongestMeta.label.toLowerCase()}, which means this is the area most worth keeping an eye on.`
      : `Your assessment suggests you may currently lean toward ${strongestMeta.label.toLowerCase()}. This does not mean something is wrong with your thinking. It means this is the pattern most likely to shape your decisions right now.`;

  const biasCards = biasOrder.map((bias) => {
    const score = finalBiasScores[bias] ?? 0;
    const meta = biasContent[bias];
    return {
      bias,
      label: meta.label,
      level: biasLevel(score),
      plainExplanation: meta.plainExplanation,
      dailyLifeExample: meta.dailyLifeExample,
      watchout: meta.watchout
    };
  });

  return {
    overallTakeaway,
    strongestBias,
    strongestBiasLabel: strongestMeta.shortLabel,
    strongestBiasExplanation: `${strongestMeta.plainExplanation} ${strongestMeta.dailyLifeExample}`,
    biasCards,
    topTakeaways: [
      strongestMeta.plainExplanation,
      secondaryTakeaway(sortedBiases),
      consistencyScore >= 0.7
        ? "Your self-view and your scenario responses tell a fairly similar story, so this pattern appears reasonably consistent."
        : "Some parts of your self-view and your scenario responses differ, so this result is best treated as a pattern to reflect on, not a fixed label."
    ],
    nextStep: strongestMeta.nextStep,
    confidencePlainLanguage: confidencePlainLanguage(confidenceScore)
  };
}

export function generateInsights({
  finalBiasScores,
  gapAnalysis,
  consistencyScore,
  confidenceScore,
  trendDelta = {}
}) {
  const primaryBias = pickPrimaryBias(finalBiasScores);
  const resultSummary = buildResultSummary({
    finalBiasScores,
    confidenceScore,
    consistencyScore
  });
  const primaryBiasLabel = biasContent[primaryBias].shortLabel;

  const insights = [
    `Your clearest current pattern is ${primaryBiasLabel.toLowerCase()}, so that is the area most likely to influence your everyday decisions right now.`,
    resultSummary.topTakeaways[1],
    resultSummary.confidencePlainLanguage
  ];

  const reflectionPrompts = [
    `Think about a recent decision where ${biasContent[primaryBias].label.toLowerCase()} may have shown up. What did you notice after the fact?`,
    "Where did your self-view differ from how you responded in the scenarios, and what might explain that gap?",
    "If you could replay one recent decision more slowly, what extra evidence or perspective would you add?"
  ];

  const coachingTip =
    trendDelta[primaryBias] > 0
      ? `This pattern has risen recently. Add one deliberate pause before a high-stakes decision this week.`
      : resultSummary.nextStep;

  return {
    headline: resultSummary.overallTakeaway,
    insights,
    reflectionPrompts,
    coachingTip,
    resultSummary,
    disclaimer: disclaimers.synthetic,
    gapNarrative: Object.entries(gapAnalysis)
      .map(([bias, value]) =>
        `${bias}: ${value > 0 ? "you see yourself as lower-risk than your responses suggest" : "your self-view is more cautious than your responses suggest"}`
      )
      .join(" | ")
  };
}
