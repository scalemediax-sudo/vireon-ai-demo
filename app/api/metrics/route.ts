import { NextResponse } from "next/server";
import { readData } from "@/lib/db";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const { contacts, conversations, messages } = await readData();

    const statusCounts = {
      total: conversations.length,
      new: contacts.filter((c) => c.status === "new").length,
      cold: contacts.filter((c) => c.status === "cold").length,
      warm: contacts.filter((c) => c.status === "warm").length,
      hot: contacts.filter((c) => c.status === "hot").length,
      booked: contacts.filter((c) => c.status === "booked").length,
      not_interested: contacts.filter((c) => c.status === "not_interested").length,
    };

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      return {
        month: format(date, "MMM"),
        conversations: conversations.filter((c) => { const d = new Date(c.createdAt); return d >= start && d <= end; }).length,
        booked: contacts.filter((c) => { const d = new Date(c.createdAt); return c.status === "booked" && d >= start && d <= end; }).length,
      };
    });

    return NextResponse.json({
      statusCounts,
      totalMessages: messages.length,
      responseRate: messages.length > 0 ? Math.round((messages.filter(m => m.from === "bot").length / messages.length) * 100) : 0,
      monthlyData,
      unreadCount: conversations.filter((c) => !c.isRead).length,
    });
  } catch (err) {
    console.error("[Metrics]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
