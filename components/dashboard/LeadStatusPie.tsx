"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface LeadStatusPieProps {
  data: { name: string; value: number; color: string }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border-light)",
      borderRadius: 10,
      padding: "8px 12px",
      boxShadow: "var(--shadow-md)",
    }}>
      <p style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 500 }}>
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  );
}

export default function LeadStatusPie({ data }: LeadStatusPieProps) {
  const filtered = data.filter((d) => d.value > 0);
  const total = filtered.reduce((s, d) => s + d.value, 0);

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-light)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="mb-5">
        <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Patient Status</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Distribution by conversation stage</p>
      </div>

      {filtered.length === 0 ? (
        <div className="h-[160px] flex items-center justify-center">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No data yet — load demo data</p>
        </div>
      ) : (
        <>
          <div className="relative flex justify-center">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={filtered} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {filtered.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{total}</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>total</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {filtered.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{d.value}</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
