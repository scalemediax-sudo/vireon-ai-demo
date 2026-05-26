"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageCircle, CalendarCheck, ThumbsDown, Flame, Snowflake, Sun, RefreshCw, Database } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import MonthlyChart from "@/components/dashboard/MonthlyChart";
import LeadStatusPie from "@/components/dashboard/LeadStatusPie";
import RecentLeads from "@/components/dashboard/RecentLeads";

interface Metrics {
  statusCounts: {
    total: number;
    new: number;
    cold: number;
    warm: number;
    hot: number;
    booked: number;
    not_interested: number;
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
      const [metricsRes, convsRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/conversations"),
      ]);
      const [m, c] = await Promise.all([metricsRes.json(), convsRes.json()]);
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

  const pieData = metrics
    ? [
        { name: "Cold", value: metrics.statusCounts.cold, color: "#3b82f6" },
        { name: "Warm", value: metrics.statusCounts.warm, color: "#f97316" },
        { name: "Hot", value: metrics.statusCounts.hot, color: "#ef4444" },
        { name: "Booked", value: metrics.statusCounts.booked, color: "#10b981" },
        { name: "Not Interested", value: metrics.statusCounts.not_interested, color: "#6b7280" },
        { name: "New", value: metrics.statusCounts.new, color: "#8b5cf6" },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/40 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">WhatsApp AI lead automation overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white text-xs transition-colors disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            {seeding ? "Seeding..." : "Load Demo Data"}
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Conversations"
          value={metrics?.statusCounts.total ?? 0}
          subtitle="All time"
          color="blue"
          icon={<MessageCircle className="w-5 h-5 text-blue-400" />}
        />
        <MetricCard
          title="Appointments Booked"
          value={metrics?.statusCounts.booked ?? 0}
          subtitle="Ready for call"
          color="green"
          icon={<CalendarCheck className="w-5 h-5 text-emerald-400" />}
        />
        <MetricCard
          title="Hot Leads"
          value={metrics?.statusCounts.hot ?? 0}
          subtitle="High intent"
          color="red"
          icon={<Flame className="w-5 h-5 text-red-400" />}
        />
        <MetricCard
          title="Not Interested"
          value={metrics?.statusCounts.not_interested ?? 0}
          subtitle="Closed out"
          color="gray"
          icon={<ThumbsDown className="w-5 h-5 text-slate-400" />}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Warm Leads"
          value={metrics?.statusCounts.warm ?? 0}
          subtitle="Engaged, building trust"
          color="orange"
          icon={<Sun className="w-5 h-5 text-orange-400" />}
        />
        <MetricCard
          title="Cold Leads"
          value={metrics?.statusCounts.cold ?? 0}
          subtitle="Early stage"
          color="purple"
          icon={<Snowflake className="w-5 h-5 text-violet-400" />}
        />
        <MetricCard
          title="Total Messages"
          value={metrics?.totalMessages ?? 0}
          subtitle="Sent + received"
          color="blue"
          icon={<MessageCircle className="w-5 h-5 text-blue-400" />}
        />
        <MetricCard
          title="Unread Chats"
          value={metrics?.unreadCount ?? 0}
          subtitle="Needs attention"
          color="yellow"
          icon={<MessageCircle className="w-5 h-5 text-yellow-400" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <MonthlyChart data={metrics?.monthlyData ?? []} />
        </div>
        <LeadStatusPie data={pieData} />
      </div>

      {/* Recent Conversations */}
      <RecentLeads conversations={conversations} />
    </div>
  );
}
