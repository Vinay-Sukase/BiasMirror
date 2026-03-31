import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";

interface BiasRadarChartProps {
  selfPerception: Record<string, number>;
  combined: Record<string, number>;
}

export function BiasRadarChart({ selfPerception, combined }: BiasRadarChartProps) {
  const data = [
    {
      bias: "Confirmation",
      Self: Math.round((selfPerception.confirmation ?? 0) * 100),
      Combined: Math.round((combined.confirmation ?? 0) * 100)
    },
    {
      bias: "Anchoring",
      Self: Math.round((selfPerception.anchoring ?? 0) * 100),
      Combined: Math.round((combined.anchoring ?? 0) * 100)
    },
    {
      bias: "Negativity",
      Self: Math.round((selfPerception.negativity ?? 0) * 100),
      Combined: Math.round((combined.negativity ?? 0) * 100)
    }
  ];

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.15)" />
          <PolarAngleAxis dataKey="bias" tick={{ fill: "#f6f1ff", fontSize: 12 }} />
          <Radar dataKey="Self" stroke="#d7cbff" fill="#d7cbff" fillOpacity={0.25} />
          <Radar dataKey="Combined" stroke="#9a7cff" fill="#9a7cff" fillOpacity={0.45} />
          <RechartsTooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
