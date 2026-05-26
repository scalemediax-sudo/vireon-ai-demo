import { NextRequest, NextResponse } from "next/server";
import { readData } from "@/lib/db";
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, subDays } from "date-fns";

function getDateRange(range: string | null): { start: Date; end: Date } | null {
  const now = new Date();
  switch (range) {
    case "today": return { start: startOfDay(now), end: endOfDay(now) };
    case "week":  return { start: subDays(now, 7), end: now };
    case "month": return { start: startOfMonth(now), end: endOfMonth(now) };
    default:      return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const range = new URL(req.url).searchParams.get("range");
    const dr = getDateRange(range);

    const { contacts, conversations, messages } = await readData();

    const inRange = <T extends { createdAt: string }>(arr: T[]) =>
      dr ? arr.filter(x => { const d = new Date(x.createdAt); return d >= dr.start && d <= dr.end; }) : arr;

    const filteredConvs     = inRange(conversations);
    const filteredContacts  = inRange(contacts);
    const filteredMessages  = dr
      ? messages.filter(m => { const d = new Date(m.timestamp); return d >= dr.start && d <= dr.end; })
      : messages;

    // All counts derive from the same filtered set so booking rate is always consistent
    const booked = filteredContacts.filter(c => c.status === "booked").length;
    const total  = filteredConvs.length;

    const statusCounts = {
      total,
      new:            filteredContacts.filter(c => c.status === "new").length,
      cold:           filteredContacts.filter(c => c.status === "cold").length,
      warm:           filteredContacts.filter(c => c.status === "warm").length,
      hot:            filteredContacts.filter(c => c.status === "hot").length,
      booked,
      not_interested: filteredContacts.filter(c => c.status === "not_interested").length,
    };

    // Monthly chart always uses all-time data regardless of filter
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date  = subMonths(new Date(), 5 - i);
      const start = startOfMonth(date);
      const end   = endOfMonth(date);
      return {
        month: format(date, "MMM"),
        conversations: conversations.filter(c => { const d = new Date(c.createdAt); return d >= start && d <= end; }).length,
        booked: contacts.filter(c => { const d = new Date(c.createdAt); return c.status === "booked" && d >= start && d <= end; }).length,
      };
    });

    return NextResponse.json({
      statusCounts,
      totalMessages: filteredMessages.length,
      bookingRate: total > 0 ? Math.round((booked / total) * 100) : 0,
      monthlyData,
      unreadCount: conversations.filter(c => !c.isRead).length,
    });
  } catch (err) {
    console.error("[Metrics]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
