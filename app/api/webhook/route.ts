import { NextRequest, NextResponse } from "next/server";
import { parseWebhookPayload, sendWhatsAppMessage } from "@/lib/whatsapp";
import { findOrCreateConversation, addMessage, updateLeadStatus, getDb } from "@/lib/db";
import { qualifyLead } from "@/lib/groq";

// WhatsApp webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Incoming messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = parseWebhookPayload(body);

    for (const msg of messages) {
      const { contact, conversation } = await findOrCreateConversation(msg.from, msg.name);

      // Store incoming message
      await addMessage(conversation.id, "customer", msg.text, msg.messageId);

      // Build conversation history for AI
      const db = await getDb();
      await db.read();
      const history = db.data.messages
        .filter((m) => m.conversationId === conversation.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-10)
        .map((m) => ({
          role: (m.from === "customer" ? "user" : "assistant") as "user" | "assistant",
          content: m.content,
        }));

      const calendlyLink = process.env.CALENDLY_LINK ?? "https://calendly.com/vireon-ai";
      const result = await qualifyLead(history, calendlyLink);

      // Update lead status
      await updateLeadStatus(contact.id, result.status);

      // Build reply
      let replyText = result.reply;
      if (result.shouldSendCalendly) {
        replyText += `\n\nBook your free call here: ${calendlyLink}`;
      }

      // Send reply
      const waId = await sendWhatsAppMessage(msg.from, replyText);
      await addMessage(conversation.id, "bot", replyText, waId ?? undefined);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
