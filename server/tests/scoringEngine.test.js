import { describe, expect, it } from "vitest";
import {
  buildMlPayload,
  computeBehavioralFeatures,
  reverseScoreIfNeeded,
  scoreScenarios,
  scoreSelfPerception
} from "../src/services/scoringEngine.js";

describe("scoringEngine", () => {
  it("reverse scores negatively keyed personality items", () => {
    expect(reverseScoreIfNeeded("EXT2", 1)).toBe(5);
    expect(reverseScoreIfNeeded("EXT1", 5)).toBe(5);
  });

  it("computes self-perception bias averages", () => {
    const scores = scoreSelfPerception({
      self_confirmation_1: 5,
      self_confirmation_2: 4,
      self_anchoring_1: 3,
      self_anchoring_2: 3,
      self_negativity_1: 2,
      self_negativity_2: 1
    });
    expect(scores.confirmation).toBeGreaterThan(scores.negativity);
  });

  it("computes scenario scores and timing metrics", () => {
    const scenarioScores = scoreScenarios({
      scenario_confirmation_1: 5,
      scenario_confirmation_2: 4,
      scenario_confirmation_3: 4,
      scenario_confirmation_4: 5,
      scenario_anchoring_1: 3,
      scenario_anchoring_2: 3,
      scenario_anchoring_3: 2,
      scenario_anchoring_4: 4,
      scenario_negativity_1: 1,
      scenario_negativity_2: 2,
      scenario_negativity_3: 2,
      scenario_negativity_4: 3
    });
    const features = computeBehavioralFeatures({
      a: 1000,
      b: 1500,
      c: 2000,
      d: 2500
    });
    expect(scenarioScores.confirmation).toBeGreaterThan(scenarioScores.negativity);
    expect(features.avg_response_time).toBe(1750);
    expect(features.response_completeness).toBe(0.08);
  });

  it("maps personality response times to ML _E columns", () => {
    const payload = buildMlPayload(
      {
        EXT1: 4,
        EXT2: 2,
        self_confirmation_1: 5
      },
      {
        EXT1: 1200,
        EXT2: 1800,
        self_confirmation_1: 900
      }
    );

    expect(payload.answers).toEqual({ EXT1: 4, EXT2: 2 });
    expect(payload.response_times).toEqual({ EXT1_E: 1200, EXT2_E: 1800 });
  });
});
