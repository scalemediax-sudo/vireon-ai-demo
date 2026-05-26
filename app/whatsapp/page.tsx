"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ConversationList from "@/components/whatsapp/ConversationList";
import ChatWindow from "@/components/whatsapp/ChatWindow";
import { MessageCircle } from "lucide-react";
import { LeadStatus } from "@/lib/db";

interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  status: LeadStatus;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  isRead: boolean;
}

interface Message {
  id: string;
  from: "bot" | "human" | "customer";
  content: string;
  timestamp: string;
}

function WhatsAppInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get("id");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [sending, setSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    if (Array.isArray(data)) setConversations(data);
  }, []);

  const fetchMessages = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`);
    const data = await res.json();
    if (data.conversation) {
      setActiveConv(data.conversation);
      setMessages(data.messages ?? []);
      // Refresh list to update read status
      fetchConversations();
    }
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 8000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
      const interval = setInterval(() => fetchMessages(selectedId), 5000);
      return () => clearInterval(interval);
    } else {
      setActiveConv(null);
      setMessages([]);
    }
  }, [selectedId, fetchMessages]);

  const handleSelect = (id: string) => {
    router.push(`/whatsapp?id=${id}`);
  };

  const handleSend = async (text: string) => {
    if (!activeConv) return;
    setSending(true);
    try {
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConv.id, message: text }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: LeadStatus) => {
    if (!activeConv) return;

    await fetch(`/api/leads/${activeConv.contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setActiveConv((prev) => prev ? { ...prev, status } : null);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? { ...c, status } : c))
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={handleSelect}
      />

      {activeConv ? (
        <ChatWindow
          conversation={activeConv}
          messages={messages}
          onSend={handleSend}
          onStatusChange={handleStatusChange}
          sending={sending}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-white/30" />
            </div>
            <p className="text-white/50 font-medium">Select a conversation</p>
            <p className="text-white/25 text-sm mt-1">Choose a chat from the left to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WhatsAppPage() {
  return (
    <Suspense>
      <WhatsAppInner />
    </Suspense>
  );
}
