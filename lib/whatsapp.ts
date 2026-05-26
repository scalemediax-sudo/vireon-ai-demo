import axios from "axios";

const BASE_URL = "https://graph.facebook.com/v19.0";

export async function sendWhatsAppMessage(to: string, text: string): Promise<string | null> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token || token === "your_access_token") {
    console.log(`[WhatsApp MOCK] To: ${to} | Message: ${text}`);
    return `mock_msg_${Date.now()}`;
  }

  try {
    const res = await axios.post(
      `${BASE_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data?.messages?.[0]?.id ?? null;
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown } };
    console.error("[WhatsApp] Send error:", error?.response?.data ?? err);
    return null;
  }
}

export interface IncomingMessage {
  from: string;
  name: string;
  messageId: string;
  text: string;
  timestamp: string;
}

export function parseWebhookPayload(body: unknown): IncomingMessage[] {
  const messages: IncomingMessage[] = [];
  try {
    const payload = body as Record<string, unknown>;
    const entry = (payload.entry as unknown[])?.[0] as Record<string, unknown>;
    const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
    const value = changes?.value as Record<string, unknown>;
    const waMessages = value?.messages as Array<Record<string, unknown>>;
    const contacts = value?.contacts as Array<Record<string, unknown>>;

    if (!waMessages) return messages;

    for (const msg of waMessages) {
      if (msg.type !== "text") continue;
      const contactEntry = contacts?.find((c) => c.wa_id === msg.from);
      const name = (contactEntry?.profile as Record<string, string>)?.name ?? String(msg.from);
      messages.push({
        from: String(msg.from),
        name,
        messageId: String(msg.id),
        text: (msg.text as Record<string, string>)?.body ?? "",
        timestamp: new Date(Number(msg.timestamp) * 1000).toISOString(),
      });
    }
  } catch (e) {
    console.error("[WhatsApp] Parse error:", e);
  }
  return messages;
}
