import { NextRequest, NextResponse } from "next/server";
import { readData } from "@/lib/db";
import type { Contact, Conversation } from "@/lib/db";
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, addDays } from "date-fns";

function getDateRange(range: string | null): { start: Date; end: Date } | null {
  const now = new Date();
  switch (range) {
    case "today": return { start: startOfDay(now), end: endOfDay(now) };
    case "week":  return { start: subDays(now, 7), end: now };
    case "month": return { start: startOfMonth(now), end: endOfMonth(now) };
    default:      return null;
  }
}

type ChartPoint = { label: string; conversations: number; booked: number };

function buildChartData(
  conversations: Conversation[],
  contacts: Contact[],
  range: string | null
): { points: ChartPoint[]; title: string } {
  const now = new Date();

  if (range === "today") {
    const points = Array.from({ length: 11 }, (_, i) => {
      const h = i + 9;
      const dayBase = startOfDay(now);
      const hourStart = new Date(dayBase.getFullYear(), dayBase.getMonth(), dayBase.getDate(), h);
      const hourEnd   = new Date(dayBase.getFullYear(), dayBase.getMonth(), dayBase.getDate(), h + 1);
      const label = h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h - 12}pm`;
      return {
        label,
        conversations: conversations.filter(c => { const d = new Date(c.createdAt); return d >= hourStart && d < hourEnd; }).length,
        booked: contacts.filter(c => { const d = new Date(c.createdAt); return c.status === "booked" && d >= hourStart && d < hourEnd; }).length,
      };
    });
    return { points, title: "Today — Hourly Breakdown" };
  }

  if (range === "week") {
    const points = Array.from({ length: 7 }, (_, i) => {
      const date  = subDays(now, 6 - i);
      const start = startOfDay(date);
      const end   = endOfDay(date);
      return {
        label: format(date, "EEE"),
        conversations: conversations.filter(c => { const d = new Date(c.createdAt); return d >= start && d <= end; }).length,
        booked: contacts.filter(c => { const d = new Date(c.createdAt); return c.status === "booked" && d >= start && d <= end; }).length,
      };
    });
    return { points, title: "Last 7 Days — Daily Breakdown" };
  }

  if (range === "month") {
    const monthStart = startOfMonth(now);
    const monthEnd   = endOfMonth(now);
    const points = Array.from({ length: 4 }, (_, i) => {
      const wStart = addDays(monthStart, i * 7);
      const wEnd   = i < 3 ? addDays(wStart, 6) : monthEnd;
      return {
        label: `Week ${i + 1}`,
        conversations: conversations.filter(c => { const d = new Date(c.createdAt); return d >= wStart && d <= wEnd; }).length,
        booked: contacts.filter(c => { const d = new Date(c.createdAt); return c.status === "booked" && d >= wStart && d <= wEnd; }).length,
      };
    });
    return { points, title: "This Month — Weekly Breakdown" };
  }

  // All time: last 6 months
  const points = Array.from({ length: 6 }, (_, i) => {
    const date  = subMonths(now, 5 - i);
    const start = startOfMonth(date);
    const end   = endOfMonth(date);
    return {
      label: format(date, "MMM"),
      conversations: conversations.filter(c => { const d = new Date(c.createdAt); return d >= start && d <= end; }).length,
      booked: contacts.filter(c => { const d = new Date(c.createdAt); return c.status === "booked" && d >= start && d <= end; }).length,
    };
  });
  return { points, title: "Monthly Overview" };
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

    const { points: chartData, title: chartTitle } = buildChartData(conversations, contacts, range);

    return NextResponse.json({
      statusCounts,
      totalMessages: filteredMessages.length,
      bookingRate: total > 0 ? Math.round((booked / total) * 100) : 0,
      chartData,
      chartTitle,
      unreadCount: conversations.filter(c => !c.isRead).length,
    });
  } catch (err) {
    console.error("[Metrics]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
