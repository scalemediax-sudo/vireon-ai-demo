"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { LeadStatus } from "@/lib/db";

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  status: LeadStatus;
  lastMessage: string;
  lastMessageAt: string;
  isRead: boolean;
}

const statusConfig: Record<LeadStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  cold: { label: "Cold", cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  warm: { label: "Warm", cls: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  hot: { label: "Hot", cls: "bg-red-500/20 text-red-300 border-red-500/30" },
  booked: { label: "Booked", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  not_interested: { label: "Not Interested", cls: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

export default function RecentLeads({ conversations }: { conversations: Conversation[] }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm">Recent Conversations</h2>
        <Link href="/whatsapp" className="text-blue-400 text-xs hover:text-blue-300 transition-colors">
          View all →
        </Link>
      </div>
      <div className="divide-y divide-white/5">
        {conversations.slice(0, 6).map((c) => {
          const cfg = statusConfig[c.status];
          return (
            <Link key={c.id} href={`/whatsapp?id=${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-semibold">{c.contactName[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium truncate">{c.contactName}</p>
                  {!c.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                </div>
                <p className="text-white/40 text-xs truncate">{c.lastMessage}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs border rounded-full px-2 py-0.5 ${cfg.cls}`}>{cfg.label}</span>
                <p className="text-white/30 text-xs mt-1">
                  {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          );
        })}
        {conversations.length === 0 && (
          <p className="text-white/30 text-sm text-center py-8">No conversations yet</p>
        )}
      </div>
    </div>
  );
}
