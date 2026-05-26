import Groq from "groq-sdk";
import { ConversationStage, AppointmentData } from "@/lib/db";
import { parse, addHours, addDays, format } from "date-fns";

let groqClient: Groq | null = null;
function getGroq() {
  if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
}

export interface AgentResult {
  reply: string;
  nextStage: ConversationStage;
  updates: Partial<AppointmentData>;
  status: "new" | "booked" | "not_interested" | "warm";
}

// Parse natural language date/time into ISO string
export function parseDateTime(input: string): Date | null {
  const now = new Date();
  const lower = input.toLowerCase().trim();

  if (lower.includes("tomorrow")) {
    const tomorrow = addDays(now, 1);
    const timeMatch = lower.match(/(\d{1,2})\s*(am|pm)/i);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]) + (timeMatch[2].toLowerCase() === "pm" && parseInt(timeMatch[1]) !== 12 ? 12 : 0);
      tomorrow.setHours(hour, 0, 0, 0);
      return tomorrow;
    }
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  }

  if (lower.includes("today")) {
    const timeMatch = lower.match(/(\d{1,2})\s*(am|pm)/i);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]) + (timeMatch[2].toLowerCase() === "pm" && parseInt(timeMatch[1]) !== 12 ? 12 : 0);
      const today = new Date(now);
      today.setHours(hour, 0, 0, 0);
      return today;
    }
    return addHours(now, 2);
  }

  // Try parsing explicit dates
  const formats = [
    "d MMM h a", "d MMMM h a", "MMMM d h a",
    "dd/MM h a", "MM/dd h a",
    "d MMM 'at' h a", "MMMM do 'at' h a",
  ];
  for (const fmt of formats) {
    try {
      const result = parse(input, fmt, now);
      if (!isNaN(result.getTime())) return result;
    } catch {}
  }
  return null;
}

export async function runClinicAgent(
  stage: ConversationStage,
  customerMessage: string,
  appointmentData: AppointmentData,
  availableSlots?: string[],
  bookedSlot?: string
): Promise<AgentResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key") {
    return getMockResponse(stage, customerMessage, appointmentData);
  }

  const groq = getGroq();

  const systemPrompt = `You are a friendly clinic receptionist AI for a medical clinic. You handle appointment bookings on WhatsApp.

Current conversation stage: ${stage}
Collected info so far: ${JSON.stringify(appointmentData)}
${availableSlots ? `Available calendar slots: ${availableSlots.join(", ")}` : ""}
${bookedSlot ? `Confirmed slot: ${bookedSlot}` : ""}

Your task based on the current stage:
- greeting: Greet the patient and ask if they want to book an appointment
- asked_intent: They responded — if YES proceed; if NO be gracious and close
- collecting_name: Ask for their full name
- collecting_concern: Ask what their concern or reason for the appointment is
- collecting_phone: Ask for their phone number
- collecting_datetime: Ask for their preferred date and time (mention you are open Mon-Sat 9am-7pm)
- checking_availability: Tell them you're checking availability
- suggesting_alternative: The requested slot is not available — suggest the provided available slots
- confirmed: Appointment is booked — give warm confirmation with all details
- declined: They don't want to book — be warm and invite them back

Rules:
- Keep messages SHORT (2-3 lines max) — this is WhatsApp
- Be warm, professional, and reassuring
- Only ask ONE thing per message
- For the confirmed stage, include: patient name, concern, date/time, and a friendly note

Respond ONLY with JSON:
{
  "reply": "your WhatsApp message",
  "nextStage": "${getNextStage(stage)}",
  "updates": {},
  "status": "new|warm|booked|not_interested"
}

For "updates" field, include any new info extracted from the patient's message:
- If collecting_name and they gave name: {"name": "..."}
- If collecting_concern and they gave concern: {"concern": "..."}
- If collecting_phone and they gave phone: {"phone": "..."}
- If collecting_datetime and they gave time: {"preferredDatetime": "..."}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: customerMessage },
      ],
      temperature: 0.5,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");

    const parsed = JSON.parse(jsonMatch[0]) as AgentResult;
    return parsed;
  } catch (e) {
    console.error("[ClinicAgent] Groq error:", e);
    return getMockResponse(stage, customerMessage, appointmentData);
  }
}

function getNextStage(current: ConversationStage): string {
  const flow: Record<ConversationStage, ConversationStage> = {
    greeting: "asked_intent",
    asked_intent: "collecting_name",
    collecting_name: "collecting_concern",
    collecting_concern: "collecting_phone",
    collecting_phone: "collecting_datetime",
    collecting_datetime: "checking_availability",
    checking_availability: "confirmed",
    suggesting_alternative: "confirmed",
    confirmed: "confirmed",
    declined: "declined",
  };
  return flow[current] ?? current;
}

function getMockResponse(
  stage: ConversationStage,
  message: string,
  data: AppointmentData
): AgentResult {
  const lower = message.toLowerCase();

  switch (stage) {
    case "greeting":
      return {
        reply: "Hello! 👋 Welcome to our clinic. Are you looking to book an appointment?",
        nextStage: "asked_intent",
        updates: {},
        status: "new",
      };

    case "asked_intent":
      if (lower.includes("no") || lower.includes("nope") || lower.includes("not")) {
        return {
          reply: "No problem! Feel free to reach out whenever you need us. Take care! 🙏",
          nextStage: "declined",
          updates: {},
          status: "not_interested",
        };
      }
      return {
        reply: "Great! Happy to help. Could you please share your full name?",
        nextStage: "collecting_name",
        updates: {},
        status: "warm",
      };

    case "collecting_name":
      return {
        reply: `Thanks, ${message.trim()}! What is your concern or reason for the appointment?`,
        nextStage: "collecting_concern",
        updates: { name: message.trim() },
        status: "warm",
      };

    case "collecting_concern":
      return {
        reply: "Understood. What's the best phone number to reach you at?",
        nextStage: "collecting_phone",
        updates: { concern: message.trim() },
        status: "warm",
      };

    case "collecting_phone":
      return {
        reply: "Thank you! What date and time would you prefer? We're open Mon–Sat, 9am–7pm.",
        nextStage: "collecting_datetime",
        updates: { phone: message.trim() },
        status: "warm",
      };

    case "collecting_datetime":
      return {
        reply: "Let me check our calendar for that slot... ⏳",
        nextStage: "checking_availability",
        updates: { preferredDatetime: message.trim() },
        status: "warm",
      };

    case "checking_availability":
    case "suggesting_alternative":
      return {
        reply: `✅ Your appointment is confirmed!\n\n*Patient:* ${data.name}\n*Concern:* ${data.concern}\n*Time:* ${data.confirmedDatetime ?? data.preferredDatetime}\n\nWe'll see you then! Please arrive 5 minutes early. 🏥`,
        nextStage: "confirmed",
        updates: {},
        status: "booked",
      };

    default:
      return {
        reply: "Hello! Are you looking to book an appointment with our clinic?",
        nextStage: "asked_intent",
        updates: {},
        status: "new",
      };
  }
}
