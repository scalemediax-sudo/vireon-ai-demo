"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageCircle, CalendarCheck, Clock, UserX,
  RefreshCw, TrendingUp, Users, Zap, IndianRupee, Target,
} from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import MonthlyChart from "@/components/dashboard/MonthlyChart";
import LeadStatusPie from "@/components/dashboard/LeadStatusPie";
import RecentLeads from "@/components/dashboard/RecentLeads";

type DateRange = "today" | "week" | "month" | "all";

interface Metrics {
  statusCounts: {
    total: number; new: number; cold: number;
    warm: number; hot: number; booked: number; not_interested: number;
  };
  totalMessages: number;
  bookingRate: number;
  monthlyData: { month: string; conversations: number; booked: number }[];
  unreadCount: number;
}

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  status: "new" | "cold" | "warm" | "hot" | "booked" | "not_interested";
  lastMessage: string;
  lastMessageAt: string;
  isRead: boolean;
}

const RANGE_LABELS: Record<DateRange, string> = {
  today: "Today",
  week:  "Last 7 Days",
  month: "This Month",
  all:   "All Time",
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>("all");

  const fetchData = useCallback(async (r: DateRange) => {
    try {
      const param = r !== "all" ? `?range=${r}` : "";
      const [m, c] = await Promise.all([
        fetch(`/api/metrics${param}`).then(res => res.json()),
        fetch("/api/conversations").then(res => res.json()),
      ]);
      setMetrics(m);
      setConversations(Array.isArray(c) ? c : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
    const interval = setInterval(() => fetchData(range), 15000);
    return () => clearInterval(interval);
  }, [fetchData, range]);

  const handleRange = (r: DateRange) => {
    setRange(r);
    fetchData(r);
  };

  const pieData = metrics ? [
    { name: "Booked",     value: metrics.statusCounts.booked,                                 color: "#30d158" },
    { name: "Collecting", value: metrics.statusCounts.warm + metrics.statusCounts.hot,        color: "#ff9f0a" },
    { name: "New",        value: metrics.statusCounts.new + metrics.statusCounts.cold,        color: "#0071e3" },
    { name: "Declined",   value: metrics.statusCounts.not_interested,                         color: "#aeaeb2" },
  ] : [];

  const estimatedRevenue = metrics ? metrics.statusCounts.booked * 500 : 0;
  const inProgress = metrics ? (metrics.statusCounts.warm + metrics.statusCounts.hot) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-7 h-7 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--blue)" }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Overview
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            WhatsApp AI appointment booking · {RANGE_LABELS[range]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* AI live badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--green-light)", color: "var(--green)" }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--green)" }} />
            AI Live
          </div>

          {/* Date range filter */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
            {(["today", "week", "month", "all"] as DateRange[]).map((r, i) => (
              <button
                key={r}
                onClick={() => handleRange(r)}
                className="px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: range === r ? "var(--blue)" : "var(--surface)",
                  color: range === r ? "white" : "var(--text-secondary)",
                  borderRight: i < 3 ? "1px solid var(--border-light)" : "none",
                }}
              >
                {r === "all" ? "All" : r === "today" ? "Today" : r === "week" ? "7 Days" : "Month"}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchData(range)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--surface)", border: "1px solid var(--border-light)", color: "var(--text-secondary)", boxShadow: "var(--shadow-sm)" }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <MetricCard
          title="Total Conversations"
          value={metrics?.statusCounts.total ?? 0}
          subtitle={RANGE_LABELS[range]}
          accent="var(--blue)"
          accentLight="var(--blue-light)"
          icon={<Users className="w-4 h-4" />}
        />
        <MetricCard
          title="Appointments Booked"
          value={metrics?.statusCounts.booked ?? 0}
          subtitle="Confirmed on calendar"
          accent="var(--green)"
          accentLight="var(--green-light)"
          icon={<CalendarCheck className="w-4 h-4" />}
        />
        <MetricCard
          title="Booking Rate"
          value={`${metrics?.bookingRate ?? 0}%`}
          subtitle={`${metrics?.statusCounts.booked ?? 0} of ${metrics?.statusCounts.total ?? 0} booked`}
          accent="var(--purple)"
          accentLight="var(--purple-light)"
          icon={<Target className="w-4 h-4" />}
        />
        <MetricCard
          title="Est. Revenue"
          value={`₹${estimatedRevenue.toLocaleString()}`}
          subtitle="@ ₹500 per visit"
          accent="var(--orange)"
          accentLight="var(--orange-light)"
          icon={<IndianRupee className="w-4 h-4" />}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="In Progress"
          value={inProgress}
          subtitle="Collecting details now"
          accent="var(--orange)"
          accentLight="var(--orange-light)"
          icon={<Clock className="w-4 h-4" />}
        />
        <MetricCard
          title="New Enquiries"
          value={(metrics?.statusCounts.new ?? 0) + (metrics?.statusCounts.cold ?? 0)}
          subtitle="Just started"
          accent="var(--blue)"
          accentLight="var(--blue-light)"
          icon={<Users className="w-4 h-4" />}
        />
        <MetricCard
          title="Declined"
          value={metrics?.statusCounts.not_interested ?? 0}
          subtitle="Not interested"
          accent="var(--text-tertiary)"
          accentLight="var(--surface-2)"
          icon={<UserX className="w-4 h-4" />}
        />
        <MetricCard
          title="Unread Chats"
          value={metrics?.unreadCount ?? 0}
          subtitle="Needs attention"
          accent="var(--red)"
          accentLight="var(--red-light)"
          icon={<MessageCircle className="w-4 h-4" />}
        />
      </div>

      {/* AI Automation strip */}
      <div
        className="rounded-xl px-5 py-4 mb-6 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, #0071e3 0%, #0058b0 100%)", color: "white" }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.15)" }}>
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">AI Automations Running</p>
          <p className="text-xs opacity-80 mt-0.5">
            24h follow-ups · appointment reminders · instant replies — all handled automatically
          </p>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          {[
            { val: 34, label: "follow-ups sent" },
            { val: 28, label: "reminders sent" },
            { val: 12, label: "converted" },
          ].map(({ val, label }) => (
            <div key={label} className="text-right">
              <p className="text-lg font-bold">{val}</p>
              <p className="text-[10px] opacity-70">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <MonthlyChart data={metrics?.monthlyData ?? []} />
        </div>
        <LeadStatusPie data={pieData} />
      </div>

      <RecentLeads conversations={conversations} />
    </div>
  );
}
