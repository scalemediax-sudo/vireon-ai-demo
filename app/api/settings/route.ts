import { NextRequest, NextResponse } from "next/server";

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url, token });
}

const DEFAULT_SETTINGS = {
  clinicName: "City Health Clinic",
  clinicPhone: "+91 98765 43210",
  clinicEmail: "info@cityhealthclinic.com",
  clinicAddress: "123 Medical Street, Mumbai 400001",
  botName: "Dr. AI Assistant",
  greetingMessage: "Hello! 👋 Welcome to City Health Clinic. Are you looking to book an appointment?",
  responseStyle: "friendly",
  language: "English",
  services: ["General Consultation", "Physiotherapy", "Dermatology", "Cardiology", "Orthopedics"],
  notificationsEnabled: true,
  notificationEmail: "",
  dailySummary: true,
  unreadAlert: true,
  followUpEnabled: true,
  reminderEnabled: true,
  reEngagementEnabled: false,
  businessHours: {
    Monday:    { open: true,  from: "09:00", to: "19:00" },
    Tuesday:   { open: true,  from: "09:00", to: "19:00" },
    Wednesday: { open: true,  from: "09:00", to: "19:00" },
    Thursday:  { open: true,  from: "09:00", to: "19:00" },
    Friday:    { open: true,  from: "09:00", to: "19:00" },
    Saturday:  { open: true,  from: "09:00", to: "17:00" },
    Sunday:    { open: false, from: "09:00", to: "17:00" },
  },
};

export async function GET() {
  try {
    const redis = await getRedis();
    if (redis) {
      const stored = await redis.get("clinic_settings");
      return NextResponse.json(stored ?? DEFAULT_SETTINGS);
    }
    return NextResponse.json(DEFAULT_SETTINGS);
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const redis = await getRedis();
    if (redis) await redis.set("clinic_settings", body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
