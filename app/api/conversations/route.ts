import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    await db.read();

    const conversations = db.data.conversations
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json(conversations);
  } catch (err) {
    console.error("[Conversations] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
