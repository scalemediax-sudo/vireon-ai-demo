"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Send, Bot, User, UserCircle, ChevronDown } from "lucide-react";
import { LeadStatus } from "@/lib/db";

interface Message {
  id: string;
  from: "bot" | "human" | "customer";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  status: LeadStatus;
}

const statusConfig: Record<LeadStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  cold: { label: "Cold", cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  warm: { label: "Warm", cls: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  hot: { label: "Hot 🔥", cls: "bg-red-500/20 text-red-300 border-red-500/30" },
  booked: { label: "Booked ✓", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  not_interested: { label: "Not Interested", cls: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

const statusOptions: LeadStatus[] = ["new", "cold", "warm", "hot", "booked", "not_interested"];

interface Props {
  conversation: Conversation;
  messages: Message[];
  onSend: (msg: string) => void;
  onStatusChange: (status: LeadStatus) => void;
  sending: boolean;
}

export default function ChatWindow({ conversation, messages, onSend, onStatusChange, sending }: Props) {
  const [input, setInput] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const cfg = statusConfig[conversation.status];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#0f172a] border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-semibold">{conversation.contactName[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">{conversation.contactName}</p>
          <p className="text-white/40 text-xs">+{conversation.contactPhone}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-1.5 text-xs border rounded-full px-3 py-1 transition-colors ${cfg.cls}`}
          >
            {cfg.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showStatusMenu && (
            <div className="absolute right-0 top-full mt-1 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-10 overflow-hidden min-w-[160px]">
              {statusOptions.map((s) => {
                const sc = statusConfig[s];
                return (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(s); setShowStatusMenu(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors"
                  >
                    <span className={`text-xs border rounded-full px-2 py-0.5 ${sc.cls}`}>{sc.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\"), linear-gradient(to bottom, #0a0f1a, #0d1424)" }}>
        {messages.map((msg) => {
          const isCustomer = msg.from === "customer";
          const isBot = msg.from === "bot";
          return (
            <div key={msg.id} className={`flex ${isCustomer ? "justify-start" : "justify-end"} gap-2`}>
              {isCustomer && (
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-auto">
                  <UserCircle className="w-4 h-4 text-white/50" />
                </div>
              )}
              <div className={`max-w-[72%] ${isCustomer ? "" : "items-end"} flex flex-col gap-1`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isCustomer
                      ? "bg-white/10 text-white rounded-tl-sm"
                      : isBot
                      ? "bg-blue-600/80 text-white rounded-tr-sm"
                      : "bg-violet-600/80 text-white rounded-tr-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1.5 ${isCustomer ? "" : "flex-row-reverse"}`}>
                  <p className="text-white/25 text-[10px]">
                    {format(new Date(msg.timestamp), "h:mm a")}
                  </p>
                  {isBot && (
                    <span className="flex items-center gap-0.5 text-blue-400/60 text-[10px]">
                      <Bot className="w-2.5 h-2.5" /> AI
                    </span>
                  )}
                  {!isBot && !isCustomer && (
                    <span className="flex items-center gap-0.5 text-violet-400/60 text-[10px]">
                      <User className="w-2.5 h-2.5" /> You
                    </span>
                  )}
                </div>
              </div>
              {!isCustomer && (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-auto ${isBot ? "bg-blue-500/20" : "bg-violet-500/20"}`}>
                  {isBot ? <Bot className="w-4 h-4 text-blue-400" /> : <User className="w-4 h-4 text-violet-400" />}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 bg-[#0f172a] border-t border-white/10">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none max-h-32 overflow-auto"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-white/20 text-xs mt-2">Press Enter to send • Shift+Enter for new line</p>
      </div>
    </div>
  );
}
