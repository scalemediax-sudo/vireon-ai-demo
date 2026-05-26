"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { LeadStatus } from "@/lib/db";
import { ArrowUpRight } from "lucide-react";

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  status: LeadStatus;
  lastMessage: string;
  lastMessageAt: string;
  isRead: boolean;
}

const statusConfig: Record<LeadStatus, { label: string; bg: string; color: string }> = {
  new:            { label: "New",          bg: "var(--surface-2)",    color: "var(--text-tertiary)" },
  cold:           { label: "Cold",         bg: "#e8f1fb",             color: "#0071e3" },
  warm:           { label: "Collecting",   bg: "var(--orange-light)", color: "var(--orange)" },
  hot:            { label: "Ready",        bg: "#fff0ef",             color: "var(--red)" },
  booked:         { label: "Booked ✓",    bg: "var(--green-light)",  color: "var(--green)" },
  not_interested: { label: "Declined",     bg: "var(--surface-2)",    color: "var(--text-tertiary)" },
};

export default function RecentLeads({ conversations }: { conversations: Conversation[] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-light)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div>
          <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Recent Conversations</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Latest patient interactions</p>
        </div>
        <Link
          href="/whatsapp"
          className="flex items-center gap-1 text-xs font-medium transition-colors"
          style={{ color: "var(--blue)" }}
        >
          View all <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div>
        {conversations.slice(0, 6).map((c, i) => {
          const cfg = statusConfig[c.status];
          return (
            <Link
              key={c.id}
              href={`/whatsapp?id=${c.id}`}
              className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderBottom: i < Math.min(conversations.length, 6) - 1 ? "1px solid var(--border-light)" : "none" }}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
                style={{ background: "var(--blue-light)", color: "var(--blue)" }}
              >
                {c.contactName[0]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {c.contactName}
                  </p>
                  {!c.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--blue)" }} />
                  )}
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  {c.lastMessage}
                </p>
              </div>

              {/* Right */}
              <div className="text-right shrink-0">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          );
        })}
        {conversations.length === 0 && (
          <div className="px-6 py-10 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No conversations yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Click "Load Demo Data" to see a preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
