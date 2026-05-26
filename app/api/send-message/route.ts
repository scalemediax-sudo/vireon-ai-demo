import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { addMessage, getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { conversationId, message } = await req.json();

    if (!conversationId || !message?.trim()) {
      return NextResponse.json({ error: "Missing conversationId or message" }, { status: 400 });
    }

    const db = await getDb();
    await db.read();
    const conversation = db.data.conversations.find((c) => c.id === conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Mark as read when agent replies
    conversation.isRead = true;
    await db.write();

    const waId = await sendWhatsAppMessage(conversation.contactPhone, message);
    const savedMessage = await addMessage(conversationId, "human", message, waId ?? undefined);

    return NextResponse.json({ success: true, message: savedMessage });
  } catch (err) {
    console.error("[Send] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
