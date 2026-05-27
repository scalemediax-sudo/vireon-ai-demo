"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Search, MessageCircle, RefreshCw, Users } from "lucide-react";

type Status = "new" | "cold" | "warm" | "hot" | "booked" | "not_interested";

interface Lead {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  status: Status;
  stage: string;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  appointmentData?: {
    concern?: string;
    confirmedDatetime?: string;
  };
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  new:            { label: "New",        color: "#0071e3", bg: "#e8f1fb", dot: "#aeaeb2" },
  cold:           { label: "New",        color: "#0071e3", bg: "#e8f1fb", dot: "#0071e3" },
  warm:           { label: "In Progress",color: "#c47a00", bg: "#fff4e0", dot: "#ff9f0a" },
  hot:            { label: "Ready",      color: "#cc2f26", bg: "#fff0ef", dot: "#ff3b30" },
  booked:         { label: "Booked",     color: "#1a9e42", bg: "#e9f9ee", dot: "#30d158" },
  not_interested: { label: "Declined",   color: "#6e6e73", bg: "#f5f5f7", dot: "#d2d2d7" },
};

const STAGE_LABELS: Record<string, string> = {
  greeting:             "Just contacted",
  asked_intent:         "Intent asked",
  collecting_name:      "Collecting name",
  collecting_concern:   "Collecting concern",
  collecting_phone:     "Collecting phone",
  collecting_datetime:  "Collecting date/time",
  checking_availability:"Checking availability",
  suggesting_alternative:"Suggesting alternative",
  confirmed:            "Appointment confirmed",
  declined:             "Not interested",
};

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const avatarColors = [
  { bg: "#e8f1fb", color: "#0071e3" },
  { bg: "#e9f9ee", color: "#1a9e42" },
  { bg: "#f5eaff", color: "#9b42c8" },
  { bg: "#fff4e0", color: "#c47a00" },
  { bg: "#fff0ef", color: "#cc2f26" },
];

type FilterStatus = "all" | Status;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (Array.isArray(data)) setLeads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    const t = setInterval(fetchLeads, 60000);
    return () => clearInterval(t);
  }, [fetchLeads]);

  const counts: Record<FilterStatus, number> = {
    all: leads.length,
    new: leads.filter(l => l.status === "new" || l.status === "cold").length,
    cold: 0,
    warm: leads.filter(l => l.status === "warm").length,
    hot: leads.filter(l => l.status === "hot").length,
    booked: leads.filter(l => l.status === "booked").length,
    not_interested: leads.filter(l => l.status === "not_interested").length,
  };

  const filtered = leads.filter(l => {
    const matchSearch =
      l.contactName.toLowerCase().includes(search.toLowerCase()) ||
      l.contactPhone.includes(search) ||
      (l.appointmentData?.concern ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      l.status === statusFilter ||
      (statusFilter === "new" && l.status === "cold");
    return matchSearch && matchStatus;
  });

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: "all",            label: "All" },
    { key: "booked",         label: "Booked" },
    { key: "warm",           label: "In Progress" },
    { key: "new",            label: "New" },
    { key: "not_interested", label: "Declined" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--blue)" }} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Leads</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>All patients who contacted via WhatsApp</p>
        </div>
        <button
          onClick={fetchLeads}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "var(--surface)", border: "1px solid var(--border-light)", color: "var(--text-secondary)", boxShadow: "var(--shadow-sm)" }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Leads",  value: leads.length,                                                      color: "var(--blue)",   bg: "var(--blue-light)" },
          { label: "Booked",       value: counts.booked,                                                     color: "var(--green)",  bg: "var(--green-light)" },
          { label: "In Progress",  value: counts.warm + counts.hot,                                          color: "var(--orange)", bg: "var(--orange-light)" },
          { label: "Declined",     value: counts.not_interested,                                             color: "var(--text-tertiary)", bg: "var(--surface-2)" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Users className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search name, phone, concern…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {filterTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: statusFilter === key ? "var(--blue)" : "var(--surface)",
                color: statusFilter === key ? "white" : "var(--text-secondary)",
                border: statusFilter === key ? "none" : "1px solid var(--border-light)",
              }}
            >
              {label}
              {key !== "cold" && (
                <span className="text-[9px] font-bold px-1 rounded"
                  style={{ background: statusFilter === key ? "rgba(255,255,255,0.25)" : "var(--surface-2)", color: statusFilter === key ? "white" : "var(--text-tertiary)" }}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Leads table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.2fr_1fr_auto] gap-4 px-5 py-3"
          style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border-light)" }}>
          {["Patient", "Phone", "Concern", "Status", "Last Seen", ""].map(h => (
            <p key={h} className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{h}</p>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-10 h-10 mb-2" style={{ color: "var(--border)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No leads found</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Try a different filter or seed demo data from the dashboard</p>
          </div>
        ) : (
          filtered.map((lead, idx) => {
            const cfg = STATUS_CONFIG[lead.status];
            const av = avatarColors[idx % avatarColors.length];
            return (
              <div
                key={lead.id}
                className="grid grid-cols-[2fr_1.5fr_1.5fr_1.2fr_1fr_auto] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-[var(--surface-2)]"
                style={{ borderBottom: idx < filtered.length - 1 ? "1px solid var(--border-light)" : "none" }}
              >
                {/* Name + initials */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ background: av.bg, color: av.color }}>
                    {getInitials(lead.contactName)}
                  </div>
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{lead.contactName}</p>
                </div>

                {/* Phone */}
                <p className="text-sm font-mono truncate" style={{ color: "var(--text-secondary)" }}>
                  +{lead.contactPhone.replace(/^91/, "91 ")}
                </p>

                {/* Concern */}
                <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                  {lead.appointmentData?.concern || <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                </p>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>

                {/* Last seen */}
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {formatDistanceToNow(new Date(lead.lastMessageAt), { addSuffix: true })}
                </p>

                {/* Action */}
                <Link
                  href={`/whatsapp?id=${lead.id}`}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: "var(--blue-light)", color: "var(--blue)" }}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Chat
                </Link>
              </div>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-center mt-4" style={{ color: "var(--text-tertiary)" }}>
          Showing {filtered.length} of {leads.length} leads
        </p>
      )}
    </div>
  );
}
