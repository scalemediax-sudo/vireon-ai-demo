"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarCheck, Clock, ChevronRight, RefreshCw, TrendingUp, Calendar, Phone, Activity } from "lucide-react";

interface Appointment {
  id: string;
  contactName: string;
  contactPhone: string;
  concern: string;
  confirmedDatetime: string;
  createdAt: string;
  lastMessageAt: string;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function getStatus(createdAt: string): { label: string; color: string; bg: string } {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days === 0) return { label: "Today", color: "#30d158", bg: "#e9f9ee" };
  if (days <= 3) return { label: "Upcoming", color: "#0071e3", bg: "#e8f1fb" };
  return { label: "Completed", color: "#6e6e73", bg: "#f5f5f7" };
}

const avatarColors = [
  { bg: "#e8f1fb", color: "#0071e3" },
  { bg: "#e9f9ee", color: "#1a9e42" },
  { bg: "#f5eaff", color: "#9b42c8" },
  { bg: "#fff4e0", color: "#c47a00" },
  { bg: "#fff0ef", color: "#cc2f26" },
];

type Filter = "all" | "today" | "upcoming" | "completed";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const all = await res.json();
      if (Array.isArray(all)) {
        const booked = all
          .filter((c: any) => c.status === "booked" && c.appointmentData?.confirmedDatetime)
          .map((c: any) => ({
            id: c.id,
            contactName: c.contactName,
            contactPhone: c.contactPhone,
            concern: c.appointmentData?.concern || "General consultation",
            confirmedDatetime: c.appointmentData.confirmedDatetime,
            createdAt: c.createdAt,
            lastMessageAt: c.lastMessageAt,
          }));
        setAppointments(booked);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    const t = setInterval(fetchAppointments, 15000);
    return () => clearInterval(t);
  }, [fetchAppointments]);

  const todayCount = appointments.filter(a => Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 86400000) === 0).length;
  const upcomingCount = appointments.filter(a => Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 86400000) <= 3).length;

  const filtered = appointments.filter(a => {
    const days = Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 86400000);
    if (filter === "today") return days === 0;
    if (filter === "upcoming") return days > 0 && days <= 3;
    if (filter === "completed") return days > 3;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--blue)" }} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Appointments
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            All confirmed bookings from WhatsApp AI
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "var(--surface)", border: "1px solid var(--border-light)", color: "var(--text-secondary)", boxShadow: "var(--shadow-sm)" }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Booked", value: appointments.length, icon: CalendarCheck, color: "var(--green)", bg: "var(--green-light)" },
          { label: "Today", value: todayCount, icon: Clock, color: "var(--blue)", bg: "var(--blue-light)" },
          { label: "This Week", value: upcomingCount, icon: Calendar, color: "var(--purple)", bg: "var(--purple-light)" },
          { label: "Est. Revenue", value: `₹${(appointments.length * 500).toLocaleString()}`, icon: TrendingUp, color: "var(--orange)", bg: "var(--orange-light)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</span>
            </div>
            <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-5">
        {(["all", "today", "upcoming", "completed"] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              background: filter === f ? "var(--blue)" : "var(--surface)",
              color: filter === f ? "white" : "var(--text-secondary)",
              border: filter === f ? "none" : "1px solid var(--border-light)",
              boxShadow: filter === f ? "none" : "var(--shadow-sm)",
            }}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="text-xs ml-auto" style={{ color: "var(--text-tertiary)" }}>
          {filtered.length} appointment{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Appointment cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <CalendarCheck className="w-12 h-12 mb-3" style={{ color: "var(--border)" }} />
          <p className="font-medium" style={{ color: "var(--text-secondary)" }}>No appointments here</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            Seed demo data from the dashboard to see sample appointments
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((apt, idx) => {
            const status = getStatus(apt.createdAt);
            const av = avatarColors[idx % avatarColors.length];
            return (
              <div
                key={apt.id}
                className="rounded-xl p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{ background: av.bg, color: av.color }}
                    >
                      {getInitials(apt.contactName)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{apt.contactName}</p>
                      <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        <Phone className="w-3 h-3" /> {apt.contactPhone}
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                    style={{ background: status.bg, color: status.color }}
                  >
                    {status.label}
                  </span>
                </div>

                {/* Details */}
                <div className="rounded-lg p-3 mb-4 space-y-2" style={{ background: "var(--surface-2)" }}>
                  <div className="flex items-start gap-2">
                    <Activity className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{apt.concern}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{apt.confirmedDatetime}</span>
                  </div>
                </div>

                <Link
                  href={`/whatsapp?id=${apt.id}`}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: "var(--blue-light)", color: "var(--blue)" }}
                >
                  View Conversation
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
