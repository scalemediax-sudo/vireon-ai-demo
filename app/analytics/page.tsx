"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, MessageCircle, Zap, Target, RefreshCw, Clock } from "lucide-react";

interface AnalyticsData {
  funnel: { total: number; engaged: number; detailsProvided: number; booked: number };
  peakHours: { hour: string; count: number }[];
  topConcerns: { concern: string; count: number }[];
  avgMsgsToBook: number;
  avgResponseTime: number;
  botResponseRate: number;
  messageSplit: { bot: number; human: number; customer: number };
  dayData: { day: string; conversations: number; booked: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-md)" }}>
      <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--blue)" }} />
      </div>
    );
  }

  if (!data) return null;

  const { funnel, peakHours, topConcerns, avgMsgsToBook, avgResponseTime, botResponseRate, messageSplit, dayData } = data;
  const conversionRate = funnel.total > 0 ? Math.round((funnel.booked / funnel.total) * 100) : 0;
  const totalMessages = messageSplit.bot + messageSplit.human + messageSplit.customer;

  const funnelSteps = [
    { label: "Total Contacted", value: funnel.total, pct: 100, color: "#0071e3" },
    { label: "Started Booking", value: funnel.engaged, pct: funnel.total > 0 ? Math.round((funnel.engaged / funnel.total) * 100) : 0, color: "#0071e3" },
    { label: "Provided All Details", value: funnel.detailsProvided, pct: funnel.total > 0 ? Math.round((funnel.detailsProvided / funnel.total) * 100) : 0, color: "#ff9f0a" },
    { label: "Appointment Booked", value: funnel.booked, pct: funnel.total > 0 ? Math.round((funnel.booked / funnel.total) * 100) : 0, color: "#30d158" },
  ];

  const splitPie = [
    { name: "AI Bot", value: messageSplit.bot, color: "#0071e3" },
    { name: "Patient", value: messageSplit.customer, color: "#30d158" },
    { name: "Staff", value: messageSplit.human, color: "#bf5af2" },
  ].filter(d => d.value > 0);

  const barColors = ["#0071e3", "#30d158", "#ff9f0a", "#bf5af2", "#ff3b30", "#64d2ff"];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>AI performance & conversation insights</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "var(--surface)", border: "1px solid var(--border-light)", color: "var(--text-secondary)", boxShadow: "var(--shadow-sm)" }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Conversion Rate", value: `${conversionRate}%`, icon: Target, color: "var(--green)", bg: "var(--green-light)", sub: "Contacts → Booked" },
          { label: "Avg Msgs to Book", value: avgMsgsToBook || "—", icon: MessageCircle, color: "var(--blue)", bg: "var(--blue-light)", sub: "Per appointment" },
          { label: "Bot Response Rate", value: `${botResponseRate}%`, icon: Zap, color: "var(--purple)", bg: "var(--purple-light)", sub: "Auto-handled" },
          { label: "Avg Response Time", value: avgResponseTime ? `${avgResponseTime}m` : "< 1m", icon: Clock, color: "var(--orange)", bg: "var(--orange-light)", sub: "Bot reply speed" },
          { label: "Total Messages", value: totalMessages, icon: TrendingUp, color: "var(--text-secondary)", bg: "var(--surface-2)", sub: "All time" },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-3 h-3" style={{ color }} />
              </div>
            </div>
            <p className="text-xl font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{value}</p>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
            <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Conversion Funnel</h2>
          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "var(--green-light)", color: "var(--green)" }}>
            {conversionRate}% overall conversion
          </span>
        </div>
        <div className="space-y-4">
          {funnelSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                style={{ background: step.color }}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{step.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{step.value}</span>
                    <span className="text-xs w-9 text-right font-medium" style={{ color: step.color }}>{step.pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${step.pct}%`, background: step.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Peak Hours</h2>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={peakHours} barSize={12}>
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#aeaeb2" }} axisLine={false} tickLine={false} interval={1} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Messages" fill="#0071e3" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Busiest Days</h2>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={dayData} barSize={16} barGap={2}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#aeaeb2" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="conversations" name="Conversations" fill="#0071e3" radius={[3, 3, 0, 0]} opacity={0.4} />
              <Bar dataKey="booked" name="Booked" fill="#30d158" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Top Patient Concerns</h2>
          {topConcerns.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No data yet — seed demo data first</p>
          ) : (
            <div className="space-y-3">
              {topConcerns.map(({ concern, count }, i) => {
                const max = topConcerns[0].count;
                return (
                  <div key={concern}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs capitalize truncate max-w-[200px]" style={{ color: "var(--text-secondary)" }}>{concern}</span>
                      <span className="text-xs font-semibold ml-2 shrink-0" style={{ color: "var(--text-primary)" }}>{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--surface-2)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: barColors[i % barColors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Message Breakdown</h2>
          {splitPie.length === 0 ? (
            <p className="text-sm mt-4" style={{ color: "var(--text-tertiary)" }}>No messages yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={splitPie} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
                    {splitPie.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-1">
                {splitPie.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{d.name}</span>
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
