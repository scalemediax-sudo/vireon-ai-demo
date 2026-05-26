import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await readData();

    const conversation = data.conversations.find((c) => c.id === id);
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const messages = data.messages
      .filter((m) => m.conversationId === id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    conversation.isRead = true;
    await writeData(data);

    return NextResponse.json({ conversation, messages });
  } catch (err) {
    console.error("[Conversation Detail]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
