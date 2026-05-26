"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MonthlyChartProps {
  data: { month: string; conversations: number; booked: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border-light)",
      borderRadius: 12,
      padding: "10px 14px",
      boxShadow: "var(--shadow-md)",
    }}>
      <p style={{ color: "var(--text-secondary)", fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 500 }}>
            {p.value} {p.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-light)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Monthly Overview</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Conversations vs booked appointments</p>
        </div>
        <div className="flex items-center gap-4">
          {[{ color: "var(--blue)", label: "Total" }, { color: "var(--green)", label: "Booked" }].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0071e3" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#0071e3" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#30d158" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#30d158" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
            axisLine={false} tickLine={false}
          />
          <YAxis tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="conversations" stroke="#0071e3" strokeWidth={2} fill="url(#blueGrad)" name="conversations" dot={false} />
          <Area type="monotone" dataKey="booked" stroke="#30d158" strokeWidth={2} fill="url(#greenGrad)" name="booked" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
