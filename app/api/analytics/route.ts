import { NextResponse } from "next/server";
import { readData } from "@/lib/db";

export async function GET() {
  try {
    const { contacts, conversations, messages } = await readData();

    const total = conversations.length;

    const engagedStages = new Set([
      "collecting_name", "collecting_concern", "collecting_phone",
      "collecting_datetime", "checking_availability", "suggesting_alternative", "confirmed",
    ]);
    const detailsStages = new Set([
      "collecting_datetime", "checking_availability", "suggesting_alternative", "confirmed",
    ]);

    const engaged = conversations.filter(c => engagedStages.has(c.stage) || c.status === "booked").length;
    const detailsProvided = conversations.filter(c => detailsStages.has(c.stage) || c.status === "booked").length;
    const booked = conversations.filter(c => c.status === "booked").length;

    // Peak hours (7am–9pm)
    const hourCounts = new Array(24).fill(0);
    messages.forEach(m => { hourCounts[new Date(m.timestamp).getHours()]++; });
    const peakHours = hourCounts.slice(7, 22).map((count, i) => {
      const h = i + 7;
      return { hour: h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h - 12}pm`, count };
    });

    // Top concerns
    const concernMap: Record<string, number> = {};
    contacts.forEach(c => {
      if (c.appointmentData?.concern) {
        const key = c.appointmentData.concern.split(" ").slice(0, 4).join(" ");
        concernMap[key] = (concernMap[key] || 0) + 1;
      }
    });
    const topConcerns = Object.entries(concernMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([concern, count]) => ({ concern, count }));

    // Avg messages to book
    const bookedIds = conversations.filter(c => c.status === "booked").map(c => c.id);
    const msgCounts = bookedIds.map(id => messages.filter(m => m.conversationId === id).length);
    const avgMsgsToBook = msgCounts.length
      ? Math.round(msgCounts.reduce((a, b) => a + b, 0) / msgCounts.length)
      : 0;

    // Bot response rate
    const withBot = conversations.filter(c =>
      messages.some(m => m.conversationId === c.id && m.from === "bot")
    ).length;
    const botResponseRate = total ? Math.round((withBot / total) * 100) : 0;

    // Message split
    const bot = messages.filter(m => m.from === "bot").length;
    const human = messages.filter(m => m.from === "human").length;
    const customer = messages.filter(m => m.from === "customer").length;

    // Day of week breakdown
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayData = dayNames.map(day => ({ day, conversations: 0, booked: 0 }));
    conversations.forEach(c => {
      const d = new Date(c.createdAt).getDay();
      dayData[d].conversations++;
      if (c.status === "booked") dayData[d].booked++;
    });

    // Response time: avg minutes from customer msg to next bot reply
    const responseTimes: number[] = [];
    conversations.forEach(c => {
      const convMsgs = messages
        .filter(m => m.conversationId === c.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      for (let i = 0; i < convMsgs.length - 1; i++) {
        if (convMsgs[i].from === "customer" && convMsgs[i + 1].from === "bot") {
          const diff = (new Date(convMsgs[i + 1].timestamp).getTime() - new Date(convMsgs[i].timestamp).getTime()) / 60000;
          if (diff < 60) responseTimes.push(diff);
        }
      }
    });
    const avgResponseTime = responseTimes.length
      ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
      : 0;

    return NextResponse.json({
      funnel: { total, engaged, detailsProvided, booked },
      peakHours,
      topConcerns,
      avgMsgsToBook,
      avgResponseTime,
      botResponseRate,
      messageSplit: { bot, human, customer },
      dayData,
    });
  } catch (err) {
    console.error("[Analytics]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
