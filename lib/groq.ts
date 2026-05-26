import Groq from "groq-sdk";

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

export interface QualificationResult {
  reply: string;
  status: "cold" | "warm" | "hot" | "booked" | "not_interested";
  shouldSendCalendly: boolean;
}

export async function qualifyLead(
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  calendlyLink: string
): Promise<QualificationResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key") {
    return getMockResponse(conversationHistory.length);
  }

  const systemPrompt = `You are Vireon AI, a friendly and professional sales assistant for an AI agency. Your job is to qualify leads who message on WhatsApp.

Your qualification goals:
1. Understand what business they run
2. Find out their biggest challenge with getting clients
3. Determine if they run ads or want to start
4. Gauge budget seriousness (are they ready to invest in automation?)
5. If they seem interested and qualified → offer to book a call via Calendly

Lead scoring:
- cold: Just browsing, not engaged, no clear need
- warm: Has a business, shows interest but not committed
- hot: Clear pain point, budget awareness, ready to talk
- booked: Agreed to book a call
- not_interested: Explicitly said not interested

Rules:
- Keep messages SHORT (2-3 sentences max) — this is WhatsApp
- Be conversational and warm, not salesy
- Ask ONE question at a time
- If they are "hot" (clear pain + budget), offer the Calendly link: ${calendlyLink}
- If they book, confirm and set status to "booked"
- If they say no/not interested, be gracious and close

Respond ONLY with JSON in this exact format:
{
  "reply": "your message to send",
  "status": "cold|warm|hot|booked|not_interested",
  "shouldSendCalendly": false
}`;

  try {
    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]) as QualificationResult;
    return parsed;
  } catch (e) {
    console.error("[Groq] Error:", e);
    return {
      reply: "Hey! Thanks for reaching out to Vireon AI. What kind of business do you run?",
      status: "cold",
      shouldSendCalendly: false,
    };
  }
}

function getMockResponse(messageCount: number): QualificationResult {
  const responses: QualificationResult[] = [
    {
      reply: "Hey! 👋 Thanks for reaching out to Vireon AI. What kind of business do you run?",
      status: "cold",
      shouldSendCalendly: false,
    },
    {
      reply: "That's great! What's your biggest challenge right now when it comes to getting new clients?",
      status: "warm",
      shouldSendCalendly: false,
    },
    {
      reply: "I totally get that. Are you currently running any ads on Meta or Google?",
      status: "warm",
      shouldSendCalendly: false,
    },
    {
      reply: "Perfect. We automate your entire lead follow-up with AI — so no lead ever slips through. Would you be open to a quick 20-min call to see if it's a fit?",
      status: "hot",
      shouldSendCalendly: true,
    },
  ];
  const idx = Math.min(messageCount, responses.length - 1);
  return responses[Math.floor(idx / 2)] ?? responses[0];
}
