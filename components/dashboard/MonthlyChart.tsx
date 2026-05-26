"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MonthlyChartProps {
  data: { month: string; conversations: number; booked: number }[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <h2 className="text-white font-semibold text-sm mb-4">Monthly Growth</h2>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
            itemStyle={{ color: "rgba(255,255,255,0.9)" }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
          <Area type="monotone" dataKey="conversations" stroke="#3b82f6" fill="url(#convGrad)" strokeWidth={2} name="Conversations" />
          <Area type="monotone" dataKey="booked" stroke="#10b981" fill="url(#bookGrad)" strokeWidth={2} name="Booked" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
