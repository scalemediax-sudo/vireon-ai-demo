import { NextRequest, NextResponse } from "next/server";
import { getDb, LeadStatus } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json() as { status: LeadStatus };

    const db = await getDb();
    await db.read();

    const contact = db.data.contacts.find((c) => c.id === id);
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

    contact.status = status;
    const conv = db.data.conversations.find((c) => c.contactId === id);
    if (conv) conv.status = status;

    await db.write();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Lead Update] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
