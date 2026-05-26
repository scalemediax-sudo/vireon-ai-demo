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

const statusColors: Record<LeadStatus, string> = {
  new: "bg-slate-400",
  cold: "bg-blue-400",
  warm: "bg-orange-400",
  hot: "bg-red-400",
  booked: "bg-emerald-400",
  not_interested: "bg-gray-500",
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
    <div className="w-80 bg-[#111827] border-r border-white/10 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <h2 className="text-white font-semibold text-sm mb-3">Conversations</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white/80 text-xs placeholder:text-white/30 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-white/30 text-xs text-center py-8">No conversations</p>
        )}
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-3 ${
              selectedId === c.id ? "bg-blue-600/10 border-l-2 border-l-blue-500" : ""
            }`}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{c.contactName[0]}</span>
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111827] ${statusColors[c.status]}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium truncate ${!c.isRead ? "text-white" : "text-white/70"}`}>
                  {c.contactName}
                </p>
                <p className="text-white/30 text-xs shrink-0 ml-2">
                  {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: false })}
                </p>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-white/40 text-xs truncate flex-1">{c.lastMessage}</p>
                {!c.isRead && (
                  <span className="ml-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] shrink-0">
                    {c.messageCount > 9 ? "9+" : c.messageCount}
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
