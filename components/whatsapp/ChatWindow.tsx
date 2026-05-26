"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Send, Bot, User, CalendarCheck, Phone, Stethoscope, ChevronDown } from "lucide-react";
import { LeadStatus, AppointmentData } from "@/lib/db";

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
  stage?: string;
  appointmentData?: AppointmentData;
}

const statusConfig: Record<LeadStatus, { label: string; bg: string; color: string }> = {
  new:            { label: "New",          bg: "var(--surface-2)",    color: "var(--text-tertiary)" },
  cold:           { label: "New",          bg: "var(--blue-light)",   color: "var(--blue)" },
  warm:           { label: "Collecting",   bg: "var(--orange-light)", color: "var(--orange)" },
  hot:            { label: "Ready",        bg: "#fff0ef",             color: "var(--red)" },
  booked:         { label: "Booked ✓",    bg: "var(--green-light)",  color: "var(--green)" },
  not_interested: { label: "Declined",     bg: "var(--surface-2)",    color: "var(--text-tertiary)" },
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
    const t = input.trim();
    if (!t || sending) return;
    onSend(t);
    setInput("");
  };

  const cfg = statusConfig[conversation.status];
  const appt = conversation.appointmentData;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center gap-3"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-light)" }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ background: "var(--blue-light)", color: "var(--blue)" }}
        >
          {conversation.contactName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {conversation.contactName}
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>+{conversation.contactPhone}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showStatusMenu && (
            <div
              className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-10 min-w-[160px]"
              style={{ background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-lg)" }}
            >
              {statusOptions.map((s) => {
                const sc = statusConfig[s];
                return (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(s); setShowStatusMenu(false); }}
                    className="w-full text-left px-4 py-2.5 transition-colors hover:bg-[var(--surface-2)] flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: sc.color }} />
                    <span className="text-xs" style={{ color: "var(--text-primary)" }}>{sc.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Appointment Info Bar */}
      {appt?.confirmedDatetime && (
        <div
          className="px-5 py-2.5 flex items-center gap-5 text-xs"
          style={{ background: "var(--green-light)", borderBottom: "1px solid #c8f0d4" }}
        >
          <div className="flex items-center gap-1.5" style={{ color: "#1a8a3c" }}>
            <CalendarCheck className="w-3.5 h-3.5" />
            <span className="font-medium">{appt.confirmedDatetime}</span>
          </div>
          {appt.concern && (
            <div className="flex items-center gap-1.5" style={{ color: "#2a9a4c" }}>
              <Stethoscope className="w-3.5 h-3.5" />
              <span>{appt.concern}</span>
            </div>
          )}
          {appt.phone && (
            <div className="flex items-center gap-1.5" style={{ color: "#2a9a4c" }}>
              <Phone className="w-3.5 h-3.5" />
              <span>{appt.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.map((msg) => {
          const isCustomer = msg.from === "customer";
          const isBot = msg.from === "bot";

          return (
            <div key={msg.id} className={`flex ${isCustomer ? "justify-start" : "justify-end"} gap-2.5 items-end`}>
              {isCustomer && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
                >
                  {conversation.contactName[0]}
                </div>
              )}

              <div className={`flex flex-col gap-1 max-w-[68%] ${isCustomer ? "" : "items-end"}`}>
                <div
                  className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: isCustomer
                      ? "var(--surface)"
                      : isBot
                      ? "var(--blue)"
                      : "#5856d6",
                    color: isCustomer ? "var(--text-primary)" : "white",
                    borderRadius: isCustomer ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                    boxShadow: isCustomer ? "var(--shadow-sm)" : "none",
                    border: isCustomer ? "1px solid var(--border-light)" : "none",
                  }}
                >
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1.5 px-1 ${isCustomer ? "" : "flex-row-reverse"}`}>
                  <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    {format(new Date(msg.timestamp), "h:mm a")}
                  </span>
                  {isBot && (
                    <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      <Bot className="w-2.5 h-2.5" /> AI
                    </span>
                  )}
                  {!isBot && !isCustomer && (
                    <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      <User className="w-2.5 h-2.5" /> You
                    </span>
                  )}
                </div>
              </div>

              {!isCustomer && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: isBot ? "var(--blue-light)" : "#ede9ff" }}
                >
                  {isBot
                    ? <Bot className="w-3.5 h-3.5" style={{ color: "var(--blue)" }} />
                    : <User className="w-3.5 h-3.5" style={{ color: "#5856d6" }} />
                  }
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-5 py-4"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--border-light)" }}
      >
        <div className="flex items-end gap-2.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Reply as clinic staff..."
            rows={1}
            className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none resize-none max-h-28 overflow-auto transition-all"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
              lineHeight: "1.5",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all"
            style={{
              background: input.trim() && !sending ? "var(--blue)" : "var(--border)",
              color: "white",
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] mt-2" style={{ color: "var(--text-tertiary)" }}>
          Enter to send · Shift+Enter for new line · AI handles WhatsApp automatically
        </p>
      </div>
    </div>
  );
}
