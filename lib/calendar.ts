import { google } from "googleapis";
import { addMinutes, addHours, format, parseISO } from "date-fns";

function getCalendarClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentials) return null;

  try {
    const key = JSON.parse(credentials);
    const auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
    return google.calendar({ version: "v3", auth });
  } catch (e) {
    console.error("[Calendar] Auth error:", e);
    return null;
  }
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";
const SLOT_DURATION = 30; // minutes

export interface SlotCheckResult {
  available: boolean;
  confirmedSlot?: string;
  alternativeSlots?: string[];
}

export async function checkAndBookSlot(
  preferredTime: Date,
  patientName: string,
  concern: string,
  patientPhone: string
): Promise<SlotCheckResult> {
  const calendar = getCalendarClient();

  // Mock mode if no calendar configured
  if (!calendar) {
    return mockBookSlot(preferredTime, patientName, concern);
  }

  const start = preferredTime;
  const end = addMinutes(preferredTime, SLOT_DURATION);

  try {
    // Check free/busy
    const freeBusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: addHours(start, 4).toISOString(),
        items: [{ id: CALENDAR_ID }],
      },
    });

    const busy = freeBusy.data.calendars?.[CALENDAR_ID]?.busy ?? [];
    const isSlotBusy = busy.some((b) => {
      const busyStart = new Date(b.start!);
      const busyEnd = new Date(b.end!);
      return start < busyEnd && end > busyStart;
    });

    if (!isSlotBusy) {
      // Book the slot
      const event = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: {
          summary: `Clinic Appointment — ${patientName}`,
          description: `Patient: ${patientName}\nPhone: ${patientPhone}\nConcern: ${concern}`,
          start: { dateTime: start.toISOString(), timeZone: "Asia/Kolkata" },
          end: { dateTime: end.toISOString(), timeZone: "Asia/Kolkata" },
          colorId: "2",
        },
      });

      return {
        available: true,
        confirmedSlot: format(start, "EEEE, d MMMM 'at' h:mm a"),
      };
    }

    // Find alternative slots (next 3 available)
    const alternatives: string[] = [];
    let probe = addMinutes(start, 30);
    let attempts = 0;

    while (alternatives.length < 3 && attempts < 20) {
      const probeEnd = addMinutes(probe, SLOT_DURATION);
      const probeBusy = busy.some((b) => {
        const bs = new Date(b.start!);
        const be = new Date(b.end!);
        return probe < be && probeEnd > bs;
      });

      if (!probeBusy && probe.getHours() >= 9 && probe.getHours() < 19) {
        alternatives.push(format(probe, "EEEE, d MMMM 'at' h:mm a"));
      }

      probe = addMinutes(probe, 30);
      attempts++;
    }

    return { available: false, alternativeSlots: alternatives };
  } catch (e) {
    console.error("[Calendar] API error:", e);
    return mockBookSlot(preferredTime, patientName, concern);
  }
}

function mockBookSlot(preferredTime: Date, patientName: string, concern: string): SlotCheckResult {
  // In mock mode, always confirm the requested slot
  return {
    available: true,
    confirmedSlot: format(preferredTime, "EEEE, d MMMM 'at' h:mm a"),
  };
}

export function formatSlotForDisplay(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, "EEEE, d MMMM 'at' h:mm a");
  } catch {
    return dateStr;
  }
}
