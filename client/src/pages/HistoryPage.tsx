import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { fetchHistory } from "@/lib/api";
import type { HistoryResponse } from "@/types/api";

export function HistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState<HistoryResponse | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    void fetchHistory().then(setHistory);
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <Card>
        <Badge>Longitudinal record</Badge>
        <h2 className="mt-4 text-3xl font-semibold">Assessment history</h2>
        <p className="mt-3 max-w-3xl text-haze">
          Review prior snapshots to understand whether your recent patterns are stable, rising, or beginning to soften.
        </p>
      </Card>
      <div className="grid gap-4">
        {(history?.entries ?? []).map((entry) => (
          <Card key={entry._id} className="grid gap-4 md:grid-cols-[180px_1fr] md:items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-haze">Captured</p>
              <p className="mt-2 text-xl font-semibold">{new Date(entry.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(entry.finalBiasScores).map(([bias, score]) => (
                  <Badge key={bias}>{bias}: {Math.round(score * 100)}</Badge>
                ))}
              </div>
              <p className="mt-4 text-haze">{entry.insights.join(" ")}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
