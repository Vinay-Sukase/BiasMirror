import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import * as api from "@/lib/api";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true
  })
}));

vi.mock("@/components/charts/BiasRadarChart", () => ({
  BiasRadarChart: () => <div>Radar Chart Mock</div>
}));

vi.mock("@/components/charts/TrendLineChart", () => ({
  TrendLineChart: () => <div>Trend Chart Mock</div>
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    fetchOverview: vi.fn(),
    fetchTrends: vi.fn(),
    fetchHistory: vi.fn()
  };
});

describe("DashboardPage", () => {
  it("shows a plain-language takeaway before the charts", async () => {
    vi.mocked(api.fetchOverview).mockResolvedValue({
      sessionCount: 3,
      latestSnapshot: {
        finalBiasScores: {
          confirmation: 0.71,
          anchoring: 0.52,
          negativity: 0.33
        },
        selfPerceptionScores: {
          confirmation: 0.63,
          anchoring: 0.41,
          negativity: 0.27
        },
        scenarioScores: {
          confirmation: 0.68,
          anchoring: 0.54,
          negativity: 0.35
        },
        confidenceScore: 0.82,
        biasStrengthIndex: 52,
        consistencyScore: 0.74,
        resultSummary: {
          overallTakeaway:
            "Your assessment suggests you may currently lean toward seeking familiar evidence.",
          strongestBias: "confirmation",
          strongestBiasLabel: "Confirmation bias",
          strongestBiasExplanation:
            "You may feel more comfortable with information that supports what you already believe.",
          biasCards: [
            {
              bias: "confirmation",
              label: "Seeking familiar evidence",
              level: "Strong",
              plainExplanation:
                "You may feel more comfortable with information that supports what you already believe.",
              dailyLifeExample:
                "This can show up when you revisit reviews or opinions that support your first choice.",
              watchout:
                "This can help you decide faster, but it can also create blind spots when useful counter-evidence is easy to dismiss."
            },
            {
              bias: "anchoring",
              label: "Holding on to the first number or idea",
              level: "Noticeable",
              plainExplanation:
                "Your first impression or estimate may influence you more than you realize.",
              dailyLifeExample:
                "This can show up when the first number you hear keeps shaping what feels reasonable.",
              watchout:
                "This can help you get oriented quickly, but it can also make it harder to adjust."
            },
            {
              bias: "negativity",
              label: "Giving extra weight to risks and setbacks",
              level: "Low",
              plainExplanation:
                "Difficult outcomes may stay louder in your mind than positive signals.",
              dailyLifeExample:
                "This can show up when one criticism stays with you longer than several positives.",
              watchout:
                "This can help you notice risk, but it can also make setbacks feel bigger than they are."
            }
          ],
          topTakeaways: [
            "You may feel most comfortable with information that supports your current view.",
            "A secondary pattern is holding on to the first number or idea.",
            "Your answers formed a fairly consistent pattern in this session."
          ],
          nextStep:
            "Before your next important decision, actively look for one credible source that challenges your first view.",
          confidencePlainLanguage:
            "This reading looks fairly steady because your answers formed a clear pattern."
        },
        insights: ["Your clearest current pattern is confirmation bias."],
        reflectionPrompts: ["What recent decision most matched this pattern?"],
        coachingTip: "Try reading one strong opposing view before your next important decision.",
        disclaimer: "Model is based on inferred relationships, not direct ground truth labels.",
        createdAt: "2026-03-31T08:00:00.000Z"
      }
    });
    vi.mocked(api.fetchTrends).mockResolvedValue({
      range: "90d",
      points: [{ date: "2026-03-31", confirmation: 0.71, anchoring: 0.52, negativity: 0.33 }]
    });
    vi.mocked(api.fetchHistory).mockResolvedValue({
      entries: [
        {
          _id: "1",
          finalBiasScores: { confirmation: 0.71, anchoring: 0.52, negativity: 0.33 },
          confidenceScore: 0.82,
          biasStrengthIndex: 52,
          insights: ["Your clearest current pattern is confirmation bias."],
          reflectionPrompts: ["What recent decision most matched this pattern?"],
          createdAt: "2026-03-31T08:00:00.000Z"
        }
      ]
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    const takeaway = await screen.findByText("Your main takeaway");
    const charts = await screen.findByText("How your answers compare");

    expect(screen.getByText("What your assessment suggests")).toBeInTheDocument();
    expect(screen.getByText("Questions to reflect on")).toBeInTheDocument();
    expect(screen.getByText("How this pattern is changing over time")).toBeInTheDocument();
    expect(takeaway.compareDocumentPosition(charts) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the empty state for first-time users", async () => {
    vi.mocked(api.fetchOverview).mockResolvedValue({
      sessionCount: 0,
      latestSnapshot: null
    });
    vi.mocked(api.fetchTrends).mockResolvedValue({
      range: "90d",
      points: []
    });
    vi.mocked(api.fetchHistory).mockResolvedValue({
      entries: []
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByText("Take your first assessment to unlock the dashboard.")
    ).toBeInTheDocument();
  });
});
