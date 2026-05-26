"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface LeadStatusPieProps {
  data: { name: string; value: number; color: string }[];
}

export default function LeadStatusPie({ data }: LeadStatusPieProps) {
  const filtered = data.filter((d) => d.value > 0);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <h2 className="text-white font-semibold text-sm mb-4">Lead Distribution</h2>
      {filtered.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-white/30 text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={filtered} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
              {filtered.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: "rgba(255,255,255,0.9)" }}
            />
            <Legend
              formatter={(value) => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
