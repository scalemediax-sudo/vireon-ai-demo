"use client";

import { useState } from "react";
import { Clock, Bell, RefreshCw, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  delay: string;
  enabled: boolean;
  sent: number;
  converted: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  borderColor: string;
}

const LOGS = [
  { contact: "Anita Desai", initials: "AD", action: "24h follow-up reminder sent", time: "2 hours ago", type: "followup" },
  { contact: "Deepak Nair", initials: "DN", action: "24h follow-up reminder sent", time: "5 hours ago", type: "followup" },
  { contact: "Rahul Verma", initials: "RV", action: "Appointment reminder sent (1h before)", time: "1 day ago", type: "reminder" },
  { contact: "Priya Sharma", initials: "PS", action: "Appointment reminder sent (1h before)", time: "2 days ago", type: "reminder" },
  { contact: "Suresh Patel", initials: "SP", action: "24h follow-up reminder sent", time: "2 days ago", type: "followup" },
  { contact: "Kiran Mehta", initials: "KM", action: "Appointment reminder sent (1h before)", time: "5 days ago", type: "reminder" },
];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: "followup",
      name: "24-Hour Follow-Up",
      description: "Automatically re-engages patients who started booking but didn't complete it within 24 hours.",
      trigger: "Lead in progress · No response for 24h",
      action: "Send a friendly WhatsApp reminder to continue booking",
      delay: "24h after last message",
      enabled: true,
      sent: 34,
      converted: 12,
      icon: <Clock className="w-4 h-4" />,
      color: "#0071e3",
      bg: "#e8f1fb",
      borderColor: "#0071e333",
    },
    {
      id: "reminder",
      name: "Appointment Reminder",
      description: "Sends a reminder 1 hour before the patient's confirmed appointment to reduce no-shows.",
      trigger: "Confirmed appointment · 1 hour before scheduled time",
      action: "Send reminder with appointment details and clinic address",
      delay: "1h before appointment",
      enabled: true,
      sent: 28,
      converted: 26,
      icon: <Bell className="w-4 h-4" />,
      color: "#30d158",
      bg: "#e9f9ee",
      borderColor: "#30d15833",
    },
    {
      id: "reengagement",
      name: "7-Day Re-Engagement",
      description: "Reaches out to warm leads who haven't responded in 7 days with a gentle check-in.",
      trigger: "Warm/cold lead · No activity for 7 days",
      action: "Send re-engagement message with a special offer",
      delay: "7 days after last contact",
      enabled: false,
      sent: 0,
      converted: 0,
      icon: <RefreshCw className="w-4 h-4" />,
      color: "#ff9f0a",
      bg: "#fff4e0",
      borderColor: "#d2d2d7",
    },
  ]);

  const toggle = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const activeCount = automations.filter(a => a.enabled).length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Automations</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {activeCount} of {automations.length} automations active · AI handles follow-ups 24/7
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--green-light)", border: "1px solid var(--green)" }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--green)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--green)" }}>AI Running</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Auto-Messages Sent", value: automations.reduce((s, a) => s + a.sent, 0), color: "var(--blue)" },
          { label: "Leads Converted via Automation", value: automations.reduce((s, a) => s + a.converted, 0), color: "var(--green)" },
          {
            label: "Automation Success Rate",
            value: (() => {
              const sent = automations.reduce((s, a) => s + a.sent, 0);
              const conv = automations.reduce((s, a) => s + a.converted, 0);
              return sent > 0 ? `${Math.round((conv / sent) * 100)}%` : "—";
            })(),
            color: "var(--purple)",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
            <p className="text-2xl font-semibold" style={{ color, letterSpacing: "-0.02em" }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Automation cards */}
      <div className="space-y-4 mb-8">
        {automations.map((auto) => (
          <div
            key={auto.id}
            className="rounded-xl p-6 transition-all"
            style={{
              background: "var(--surface)",
              border: `1px solid ${auto.enabled ? auto.borderColor : "var(--border-light)"}`,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: auto.bg, color: auto.color }}>
                  {auto.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{auto.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: auto.enabled ? auto.bg : "var(--surface-2)", color: auto.enabled ? auto.color : "var(--text-tertiary)" }}>
                      {auto.enabled ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-tertiary)", maxWidth: "480px" }}>{auto.description}</p>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggle(auto.id)}
                className="relative w-12 h-6 rounded-full transition-all duration-200 shrink-0 ml-4"
                style={{ background: auto.enabled ? auto.color : "var(--border)" }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: auto.enabled ? "calc(100% - 22px)" : "2px" }}
                />
              </button>
            </div>

            {/* Flow diagram */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4" style={{ background: "var(--surface-2)" }}>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--orange)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{auto.trigger}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--green)" }} />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{auto.action}</span>
              </div>
              <div className="ml-auto flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{auto.delay}</span>
              </div>
            </div>

            {/* Stats */}
            {auto.sent > 0 ? (
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Sent</p>
                  <p className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{auto.sent}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Converted</p>
                  <p className="text-xl font-semibold" style={{ color: "var(--green)" }}>{auto.converted}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Success Rate</p>
                  <p className="text-xl font-semibold" style={{ color: auto.color }}>{Math.round((auto.converted / auto.sent) * 100)}%</p>
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Enable to start sending automated messages to inactive leads</p>
            )}
          </div>
        ))}
      </div>

      {/* Activity log */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Automation Activity</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Last automated messages sent by AI</p>
        </div>
        {LOGS.map((log, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-6 py-3"
            style={{ borderBottom: i < LOGS.length - 1 ? "1px solid var(--border-light)" : "none" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{
                background: log.type === "followup" ? "#e8f1fb" : "#e9f9ee",
                color: log.type === "followup" ? "#0071e3" : "#1a9e42",
              }}
            >
              {log.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{log.contact}</p>
              <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{log.action}</p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: log.type === "followup" ? "#e8f1fb" : "#e9f9ee", color: log.type === "followup" ? "#0071e3" : "#1a9e42" }}
              >
                {log.type === "followup" ? "Follow-up" : "Reminder"}
              </span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{log.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
