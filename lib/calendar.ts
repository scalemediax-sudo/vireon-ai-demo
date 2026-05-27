import { google } from "googleapis";
import { addMinutes, addHours, format, parseISO } from "date-fns";

const SHARED_CALENDAR_NAME = "Clinic Appointments — Vireon AI";
const CLINIC_OWNER_EMAIL =
  process.env.CLINIC_OWNER_EMAIL ??
  process.env.GMAIL_USER ??
  "sharmadhruvesh645@gmail.com";

const SLOT_DURATION = 30; // minutes

// Module-level cache so we only run the create/share logic once per instance
let resolvedCalendarId: string | null = null;

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

async function getOrCreateCalendarId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calendar: any
): Promise<string> {
  if (resolvedCalendarId) return resolvedCalendarId;

  // Try Redis cache
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({ url, token });
      const cached = await redis.get<string>("clinic_calendar_id");
      if (cached) {
        resolvedCalendarId = cached;
        return cached;
      }
    }
  } catch (_) { /* Redis unavailable — proceed */ }

  try {
    // Check if calendar already exists in the service account's list
    const list = await calendar.calendarList.list();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = list.data.items?.find((c: any) => c.summary === SHARED_CALENDAR_NAME);

    let calId: string;
    if (existing) {
      calId = existing.id;
    } else {
      // Create a new calendar owned by the service account
      const created = await calendar.calendars.insert({
        requestBody: { summary: SHARED_CALENDAR_NAME, timeZone: "Asia/Kolkata" },
      });
      calId = created.data.id!;

      // Share it with the clinic owner so it appears in their Google Calendar
      await calendar.acl.insert({
        calendarId: calId,
        requestBody: {
          role: "writer",
          scope: { type: "user", value: CLINIC_OWNER_EMAIL },
        },
      });
      console.log(`[Calendar] Created & shared "${SHARED_CALENDAR_NAME}" → ${CLINIC_OWNER_EMAIL}`);
    }

    // Cache in Redis (30 days TTL)
    try {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (url && token) {
        const { Redis } = await import("@upstash/redis");
        const redis = new Redis({ url, token });
        await redis.set("clinic_calendar_id", calId, { ex: 86400 * 30 });
      }
    } catch (_) { /* non-fatal */ }

    resolvedCalendarId = calId;
    return calId;
  } catch (e) {
    console.error("[Calendar] Failed to resolve calendar ID:", e);
    return "primary";
  }
}

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

  const calendarId = await getOrCreateCalendarId(calendar);
  const start = preferredTime;
  const end = addMinutes(preferredTime, SLOT_DURATION);

  try {
    // Check free/busy
    const freeBusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: addHours(start, 4).toISOString(),
        items: [{ id: calendarId }],
      },
    });

    const busy = freeBusy.data.calendars?.[calendarId]?.busy ?? [];
    const isSlotBusy = busy.some((b) => {
      const busyStart = new Date(b.start!);
      const busyEnd = new Date(b.end!);
      return start < busyEnd && end > busyStart;
    });

    if (!isSlotBusy) {
      await calendar.events.insert({
        calendarId,
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
