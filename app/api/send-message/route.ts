import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { addMessage, readData, writeData } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { conversationId, message } = await req.json();
    if (!conversationId || !message?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const data = await readData();
    const conversation = data.conversations.find((c) => c.id === conversationId);
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    conversation.isRead = true;
    await writeData(data);

    const waId = await sendWhatsAppMessage(conversation.contactPhone, message);
    const saved = await addMessage(conversationId, "human", message, waId ?? undefined);
    return NextResponse.json({ success: true, message: saved });
  } catch (err) {
    console.error("[Send]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
