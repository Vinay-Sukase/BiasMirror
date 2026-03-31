import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TrendLineChartProps {
  points: Array<Record<string, string | number>>;
}

export function TrendLineChart({ points }: TrendLineChartProps) {
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <XAxis dataKey="date" stroke="#d7cbff" tickLine={false} axisLine={false} />
          <YAxis stroke="#d7cbff" tickLine={false} axisLine={false} domain={[0, 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="confirmation" stroke="#b89fff" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="anchoring" stroke="#8062ff" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="negativity" stroke="#f098ff" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
