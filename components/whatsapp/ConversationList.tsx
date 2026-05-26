"use client";

import { formatDistanceToNow } from "date-fns";
import { LeadStatus } from "@/lib/db";
import { Search } from "lucide-react";
import { useState } from "react";

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  status: LeadStatus;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  isRead: boolean;
}

const statusDot: Record<LeadStatus, string> = {
  new: "#aeaeb2",
  cold: "#0071e3",
  warm: "#ff9f0a",
  hot: "#ff3b30",
  booked: "#30d158",
  not_interested: "#d2d2d7",
};

const statusLabel: Record<LeadStatus, string> = {
  new: "New",
  cold: "New",
  warm: "Collecting",
  hot: "Ready",
  booked: "Booked",
  not_interested: "Declined",
};

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ConversationList({ conversations, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter(
    (c) =>
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPhone.includes(search)
  );

  return (
    <div
      className="w-72 flex flex-col h-full shrink-0"
      style={{ background: "var(--surface)", borderRight: "1px solid var(--border-light)" }}
    >
      {/* Header */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Conversations</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none transition-all"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-xs text-center py-8" style={{ color: "var(--text-tertiary)" }}>
            No conversations found
          </p>
        )}
        {filtered.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
            style={{
              background: selectedId === c.id ? "var(--blue-light)" : "transparent",
              borderBottom: i < filtered.length - 1 ? "1px solid var(--border-light)" : "none",
              borderLeft: selectedId === c.id ? "2.5px solid var(--blue)" : "2.5px solid transparent",
            }}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ background: "var(--blue-light)", color: "var(--blue)" }}
              >
                {c.contactName[0]}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: statusDot[c.status], borderColor: "var(--surface)" }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {c.contactName}
                </p>
                <p className="text-[10px] shrink-0" style={{ color: "var(--text-tertiary)" }}>
                  {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: false })}
                </p>
              </div>
              <div className="flex items-center justify-between mt-0.5 gap-1">
                <p className="text-[11px] truncate flex-1" style={{ color: "var(--text-tertiary)" }}>
                  {c.lastMessage}
                </p>
                {!c.isRead ? (
                  <span
                    className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] shrink-0 font-medium"
                    style={{ background: "var(--blue)" }}
                  >
                    {c.messageCount > 9 ? "9+" : c.messageCount}
                  </span>
                ) : (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: selectedId === c.id ? "white" : "var(--surface-2)", color: statusDot[c.status] }}
                  >
                    {statusLabel[c.status]}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
