import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import path from "path";

export type LeadStatus = "new" | "cold" | "warm" | "hot" | "booked" | "not_interested";

export type ConversationStage =
  | "greeting"
  | "asked_intent"
  | "collecting_name"
  | "collecting_concern"
  | "collecting_phone"
  | "collecting_datetime"
  | "checking_availability"
  | "suggesting_alternative"
  | "confirmed"
  | "declined";

export interface AppointmentData {
  name?: string;
  concern?: string;
  phone?: string;
  preferredDatetime?: string;
  confirmedDatetime?: string;
  calendarEventId?: string;
}

export interface Contact {
  id: string;
  phone: string;
  name: string;
  status: LeadStatus;
  stage: ConversationStage;
  appointmentData: AppointmentData;
  createdAt: string;
  lastContactAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  from: "bot" | "human" | "customer";
  content: string;
  timestamp: string;
  waMessageId?: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  contactPhone: string;
  contactName: string;
  status: LeadStatus;
  stage: ConversationStage;
  appointmentData: AppointmentData;
  messageCount: number;
  lastMessageAt: string;
  lastMessage: string;
  createdAt: string;
  isRead: boolean;
}

export interface DbSchema {
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
}

const defaultData: DbSchema = { contacts: [], conversations: [], messages: [] };

// ── Storage backend selection ──────────────────────────────────────────────
// Uses Upstash Redis when env vars are present, falls back to lowdb (local JSON)

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url, token });
}

// ── Lowdb fallback ─────────────────────────────────────────────────────────
let dbInstance: Low<DbSchema> | null = null;
async function getLowDb(): Promise<Low<DbSchema>> {
  if (dbInstance) return dbInstance;
  const dbPath = path.join(process.cwd(), "data", "db.json");
  dbInstance = await JSONFilePreset<DbSchema>(dbPath, defaultData);
  return dbInstance;
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getDb(): Promise<Low<DbSchema>> {
  return getLowDb();
}

async function readAll(): Promise<DbSchema> {
  const redis = await getRedis();
  if (redis) {
    const [contacts, conversations, messages] = await Promise.all([
      redis.get<Contact[]>("contacts"),
      redis.get<Conversation[]>("conversations"),
      redis.get<Message[]>("messages"),
    ]);
    return {
      contacts: contacts ?? [],
      conversations: conversations ?? [],
      messages: messages ?? [],
    };
  }
  const db = await getLowDb();
  await db.read();
  return db.data;
}

async function writeAll(data: DbSchema): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await Promise.all([
      redis.set("contacts", data.contacts),
      redis.set("conversations", data.conversations),
      redis.set("messages", data.messages),
    ]);
    return;
  }
  const db = await getLowDb();
  db.data = data;
  await db.write();
}

export async function findOrCreateConversation(
  phone: string,
  name: string
): Promise<{ contact: Contact; conversation: Conversation }> {
  const data = await readAll();

  let contact = data.contacts.find((c) => c.phone === phone);
  if (!contact) {
    contact = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      phone, name,
      status: "new",
      stage: "greeting",
      appointmentData: {},
      createdAt: new Date().toISOString(),
      lastContactAt: new Date().toISOString(),
    };
    data.contacts.push(contact);
  } else {
    contact.lastContactAt = new Date().toISOString();
  }

  let conversation = data.conversations.find((cv) => cv.contactId === contact!.id);
  if (!conversation) {
    conversation = {
      id: `cv_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      contactId: contact.id,
      contactPhone: phone,
      contactName: name,
      status: contact.status,
      stage: contact.stage,
      appointmentData: contact.appointmentData,
      messageCount: 0,
      lastMessageAt: new Date().toISOString(),
      lastMessage: "",
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    data.conversations.push(conversation);
  }

  await writeAll(data);
  return { contact, conversation };
}

export async function addMessage(
  conversationId: string,
  from: Message["from"],
  content: string,
  waMessageId?: string
): Promise<Message> {
  const data = await readAll();

  const message: Message = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    conversationId, from, content,
    timestamp: new Date().toISOString(),
    waMessageId,
  };
  data.messages.push(message);

  const conv = data.conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.messageCount += 1;
    conv.lastMessageAt = message.timestamp;
    conv.lastMessage = content.slice(0, 80);
    if (from === "customer") conv.isRead = false;
  }

  await writeAll(data);
  return message;
}

export async function updateContact(
  contactId: string,
  updates: Partial<Pick<Contact, "status" | "stage" | "appointmentData" | "name">>
): Promise<void> {
  const data = await readAll();

  const contact = data.contacts.find((c) => c.id === contactId);
  if (contact) Object.assign(contact, updates);

  const conv = data.conversations.find((c) => c.contactId === contactId);
  if (conv) {
    if (updates.status) conv.status = updates.status;
    if (updates.stage) conv.stage = updates.stage;
    if (updates.appointmentData) conv.appointmentData = { ...conv.appointmentData, ...updates.appointmentData };
    if (updates.name && updates.name !== "Unknown") {
      conv.contactName = updates.name;
      if (contact) contact.name = updates.name;
    }
  }

  await writeAll(data);
}

export async function readData(): Promise<DbSchema> {
  return readAll();
}

export async function writeData(data: DbSchema): Promise<void> {
  return writeAll(data);
}
