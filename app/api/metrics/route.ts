import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const db = await getDb();
    await db.read();

    const contacts = db.data.contacts;
    const conversations = db.data.conversations;
    const messages = db.data.messages;

    const statusCounts = {
      total: conversations.length,
      new: contacts.filter((c) => c.status === "new").length,
      cold: contacts.filter((c) => c.status === "cold").length,
      warm: contacts.filter((c) => c.status === "warm").length,
      hot: contacts.filter((c) => c.status === "hot").length,
      booked: contacts.filter((c) => c.status === "booked").length,
      not_interested: contacts.filter((c) => c.status === "not_interested").length,
    };

    const totalMessages = messages.length;
    const botMessages = messages.filter((m) => m.from === "bot").length;
    const responseRate = totalMessages > 0 ? Math.round((botMessages / totalMessages) * 100) : 0;

    // Monthly growth — last 6 months
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const count = conversations.filter((c) => {
        const d = new Date(c.createdAt);
        return d >= start && d <= end;
      }).length;
      const booked = contacts.filter((c) => {
        const d = new Date(c.createdAt);
        return c.status === "booked" && d >= start && d <= end;
      }).length;
      return {
        month: format(date, "MMM"),
        conversations: count,
        booked,
      };
    });

    const unreadCount = conversations.filter((c) => !c.isRead).length;

    return NextResponse.json({
      statusCounts,
      totalMessages,
      responseRate,
      monthlyData,
      unreadCount,
    });
  } catch (err) {
    console.error("[Metrics] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
