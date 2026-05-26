import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.read();

    const conversation = db.data.conversations.find((c) => c.id === id);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = db.data.messages
      .filter((m) => m.conversationId === id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Mark as read
    conversation.isRead = true;
    await db.write();

    return NextResponse.json({ conversation, messages });
  } catch (err) {
    console.error("[Conversation Detail] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
