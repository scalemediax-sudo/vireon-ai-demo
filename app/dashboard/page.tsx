"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageCircle, CalendarCheck, Clock, UserX,
  RefreshCw, Database, TrendingUp, Users
} from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import MonthlyChart from "@/components/dashboard/MonthlyChart";
import LeadStatusPie from "@/components/dashboard/LeadStatusPie";
import RecentLeads from "@/components/dashboard/RecentLeads";

interface Metrics {
  statusCounts: {
    total: number; new: number; cold: number;
    warm: number; hot: number; booked: number; not_interested: number;
  };
  totalMessages: number;
  responseRate: number;
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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([
        fetch("/api/metrics").then(r => r.json()),
        fetch("/api/conversations").then(r => r.json()),
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
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch("/api/seed", { method: "POST" });
      await fetchData();
    } finally {
      setSeeding(false);
    }
  };

  const pieData = metrics ? [
    { name: "Booked",    value: metrics.statusCounts.booked,        color: "#30d158" },
    { name: "Collecting", value: metrics.statusCounts.warm + metrics.statusCounts.hot, color: "#ff9f0a" },
    { name: "New",       value: metrics.statusCounts.new + metrics.statusCounts.cold,  color: "#0071e3" },
    { name: "Declined",  value: metrics.statusCounts.not_interested, color: "#aeaeb2" },
  ] : [];

  const bookingRate = metrics && metrics.statusCounts.total > 0
    ? Math.round((metrics.statusCounts.booked / metrics.statusCounts.total) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-7 h-7 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--border)", borderTopColor: "var(--blue)" }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Loading...</p>
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
            WhatsApp AI appointment booking · auto-updates every 15s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-light)",
              color: "var(--text-secondary)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Database className="w-3.5 h-3.5" />
            {seeding ? "Loading..." : "Demo Data"}
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-light)",
              color: "var(--text-secondary)",
              boxShadow: "var(--shadow-sm)",
            }}
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
          subtitle="All time"
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
          value={`${bookingRate}%`}
          subtitle="Conversations → bookings"
          accent="var(--purple)"
          accentLight="var(--purple-light)"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          title="Unread Chats"
          value={metrics?.unreadCount ?? 0}
          subtitle="Needs attention"
          accent="var(--orange)"
          accentLight="var(--orange-light)"
          icon={<MessageCircle className="w-4 h-4" />}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Collecting Details"
          value={(metrics?.statusCounts.warm ?? 0) + (metrics?.statusCounts.hot ?? 0)}
          subtitle="In progress"
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
          title="Total Messages"
          value={metrics?.totalMessages ?? 0}
          subtitle="Sent + received"
          accent="var(--purple)"
          accentLight="var(--purple-light)"
          icon={<MessageCircle className="w-4 h-4" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <MonthlyChart data={metrics?.monthlyData ?? []} />
        </div>
        <LeadStatusPie data={pieData} />
      </div>

      {/* Recent conversations */}
      <RecentLeads conversations={conversations} />
    </div>
  );
}
