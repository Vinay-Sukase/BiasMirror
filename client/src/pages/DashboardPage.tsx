import { useDeferredValue, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { BiasRadarChart } from "@/components/charts/BiasRadarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { fetchHistory, fetchOverview, fetchTrends } from "@/lib/api";
import type { HistoryResponse, OverviewResponse, ResultSummary, TrendsResponse } from "@/types/api";

const fallbackBiasLabels = {
  confirmation: "Confirmation bias",
  anchoring: "Anchoring bias",
  negativity: "Negativity bias"
} as const;

function buildFallbackResultSummary(latest: NonNullable<OverviewResponse["latestSnapshot"]>): ResultSummary {
  const sorted = Object.entries(latest.finalBiasScores).sort((a, b) => b[1] - a[1]);
  const strongestBias = (sorted[0]?.[0] ?? "confirmation") as ResultSummary["strongestBias"];

  return {
    overallTakeaway: `Your latest assessment suggests the clearest pattern right now is ${fallbackBiasLabels[strongestBias].toLowerCase()}. Use this as a helpful reflection point, not as a fixed label.`,
    strongestBias,
    strongestBiasLabel: fallbackBiasLabels[strongestBias],
    strongestBiasExplanation:
      "This pattern is the one most likely to shape your decisions at the moment based on your latest assessment.",
    biasCards: (Object.entries(latest.finalBiasScores) as Array<[ResultSummary["strongestBias"], number]>).map(
      ([bias, score]) => ({
        bias,
        label: fallbackBiasLabels[bias],
        level: score >= 0.67 ? "Strong" : score >= 0.34 ? "Noticeable" : "Low",
        plainExplanation: "This score estimates how much this pattern may influence your thinking right now.",
        dailyLifeExample: "It may show up in everyday decisions, feedback, or first impressions.",
        watchout: "This can be useful in some situations, but it can also create blind spots when the decision needs a more balanced view."
      })
    ),
    topTakeaways: [
      `Your strongest current pattern is ${fallbackBiasLabels[strongestBias].toLowerCase()}.`,
      "This result is meant to help you reflect on decision habits in daily life.",
      "The charts below show supporting patterns rather than a diagnosis."
    ],
    nextStep: "Pick one important decision this week and slow it down by checking one extra perspective before you decide.",
    confidencePlainLanguage:
      latest.confidenceScore >= 0.8
        ? "This reading looks fairly steady because your answers formed a clear pattern."
        : "This reading is useful, but it should be treated as an estimate that can shift over time."
  };
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [range, setRange] = useState<"30d" | "90d" | "365d">("90d");
  const deferredPoints = useDeferredValue(trends?.points ?? []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    void Promise.all([fetchOverview(), fetchTrends(range), fetchHistory()]).then(([overviewData, trendData, historyData]) => {
      setOverview(overviewData);
      setTrends(trendData);
      setHistory(historyData);
    });
  }, [isAuthenticated, navigate, range]);

  if (!isAuthenticated) return null;

  if (!overview?.latestSnapshot) {
    return (
      <Card className="space-y-6">
        <Badge>No completed sessions yet</Badge>
        <h2 className="text-3xl font-semibold">Take your first assessment to unlock the dashboard.</h2>
        <p className="max-w-2xl text-haze">
          BiasMirror needs one completed session before it can plot trends, compare self-perception with behavior, or generate reflection prompts.
        </p>
        <Link to="/assessment">
          <Button>Start assessment</Button>
        </Link>
      </Card>
    );
  }

  const latest = overview.latestSnapshot;
  const resultSummary = latest.resultSummary ?? buildFallbackResultSummary(latest);
  const strongestBiasCard =
    resultSummary.biasCards.find((card) => card.bias === resultSummary.strongestBias) ??
    resultSummary.biasCards[0];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge>Latest result</Badge>
              <h2 className="mt-4 text-3xl font-semibold">What your assessment suggests</h2>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-haze">{resultSummary.overallTakeaway}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-haze">Sessions</p>
              <p className="text-3xl font-semibold">{overview.sessionCount}</p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-iris/20 bg-iris/10 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-haze">Your main takeaway</p>
              <h3 className="mt-3 text-2xl font-semibold">{resultSummary.strongestBiasLabel}</h3>
              <p className="mt-3 leading-7 text-haze">{resultSummary.strongestBiasExplanation}</p>
              <div className="mt-5 space-y-3">
                {resultSummary.topTakeaways.map((takeaway) => (
                  <div key={takeaway} className="rounded-[20px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-ink">
                    {takeaway}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/6 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-haze">Strongest bias right now</p>
                <p className="mt-3 text-2xl font-semibold">{strongestBiasCard?.label}</p>
                <Badge className="mt-4">{strongestBiasCard?.level}</Badge>
                <p className="mt-4 text-haze">{strongestBiasCard?.watchout}</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/6 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-haze">Next step</p>
                <p className="mt-3 text-haze">{resultSummary.nextStep}</p>
              </div>
            </div>
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-haze">Overall intensity</p>
            <p className="mt-3 text-5xl font-semibold">{Math.round(latest.biasStrengthIndex)}</p>
            <p className="mt-2 text-haze">
              A simple summary of how strongly your three measured bias patterns are showing up right now.
            </p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-haze">
              <span>How steady this reading is</span>
              <Tooltip content="This is based on answer consistency, response completeness, and model agreement.">
                <button type="button" className="inline-flex text-haze">
                  <Info className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
            <p className="mt-3 text-5xl font-semibold">{Math.round(latest.confidenceScore * 100)}%</p>
            <p className="mt-2 text-haze">{resultSummary.confidencePlainLanguage}</p>
          </Card>
          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-haze">What to watch for</p>
            <p className="mt-3 text-haze">{strongestBiasCard?.dailyLifeExample}</p>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {resultSummary.biasCards.map((card) => (
          <Card key={card.bias} className="h-full">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">{card.label}</h3>
              <Badge>{card.level}</Badge>
            </div>
            <p className="mt-4 leading-7 text-haze">{card.plainExplanation}</p>
            <div className="mt-5 rounded-[20px] border border-white/10 bg-white/6 p-4 text-sm text-haze">
              <p>{card.dailyLifeExample}</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-haze">{card.watchout}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold">How your answers compare</h3>
              <p className="mt-1 text-haze">
                This chart compares how you describe yourself with the fuller pattern estimated from your full assessment.
              </p>
            </div>
          </div>
          <BiasRadarChart
            selfPerception={latest.selfPerceptionScores}
            combined={latest.finalBiasScores}
          />
        </Card>
        <Card className="space-y-5">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">How this pattern is changing over time</h3>
                <p className="mt-1 text-haze">Use these trend lines as supporting context for how your recent results are moving.</p>
              </div>
              <div className="flex gap-2">
                {(["30d", "90d", "365d"] as const).map((option) => (
                  <Button key={option} variant={range === option ? "primary" : "ghost"} onClick={() => setRange(option)}>
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <TrendLineChart points={deferredPoints as Array<Record<string, string | number>>} />
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-2xl font-semibold">Questions to reflect on</h3>
          <div className="mt-5 space-y-4">
            {latest.reflectionPrompts.map((prompt) => (
              <div key={prompt} className="rounded-[24px] border border-white/10 bg-white/6 p-5 text-haze">
                {prompt}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[24px] border border-iris/20 bg-iris/10 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-haze">Try this next</p>
            <p className="mt-3">{resultSummary.nextStep}</p>
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <h3 className="text-2xl font-semibold">Important note</h3>
            <p className="mt-4 text-haze">
              This is an estimate of patterns in how you may think and decide. It is not a diagnosis. {latest.disclaimer ?? "Model is based on inferred relationships, not direct ground truth labels."}
            </p>
          </Card>
          <Card>
            <h3 className="text-2xl font-semibold">Recent history</h3>
            <div className="mt-5 space-y-4">
              {(history?.entries ?? []).slice(0, 4).map((entry) => (
                <div key={entry._id} className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{new Date(entry.createdAt).toLocaleDateString()}</p>
                    <Badge>{Math.round(entry.confidenceScore * 100)}% steady</Badge>
                  </div>
                  <p className="mt-3 text-sm text-haze">{entry.insights[0]}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-2xl font-semibold">Analysis in one line</h3>
            <p className="mt-4 text-haze">{latest.coachingTip}</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
