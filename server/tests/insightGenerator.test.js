import { describe, expect, it } from "vitest";
import { buildResultSummary, generateInsights } from "../src/services/insightGenerator.js";

describe("insightGenerator", () => {
  it("builds a plain-language result summary around the strongest bias", () => {
    const summary = buildResultSummary({
      finalBiasScores: {
        confirmation: 0.78,
        anchoring: 0.42,
        negativity: 0.31
      },
      confidenceScore: 0.84,
      consistencyScore: 0.76
    });

    expect(summary.strongestBias).toBe("confirmation");
    expect(summary.strongestBiasLabel).toBe("Confirmation bias");
    expect(summary.biasCards).toHaveLength(3);
    expect(summary.topTakeaways[0]).toMatch(/comfortable with information/i);
    expect(summary.confidencePlainLanguage).toMatch(/steady/i);
  });

  it("returns supportive narratives with disclaimer-ready result data", () => {
    const narratives = generateInsights({
      finalBiasScores: {
        confirmation: 0.22,
        anchoring: 0.39,
        negativity: 0.69
      },
      gapAnalysis: {
        confirmation: -0.1,
        anchoring: 0.04,
        negativity: 0.09
      },
      consistencyScore: 0.58,
      confidenceScore: 0.63
    });

    expect(narratives.resultSummary.strongestBias).toBe("negativity");
    expect(narratives.headline).toMatch(/Your assessment suggests|does not point/i);
    expect(narratives.insights.join(" ")).toMatch(/everyday decisions|reading/i);
    expect(narratives.resultSummary.nextStep).toBeTruthy();
  });
});
