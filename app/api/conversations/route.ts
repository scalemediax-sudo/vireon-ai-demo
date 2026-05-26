import { NextResponse } from "next/server";
import { readData } from "@/lib/db";

export async function GET() {
  try {
    const data = await readData();
    const conversations = data.conversations
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    return NextResponse.json(conversations);
  } catch (err) {
    console.error("[Conversations]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
