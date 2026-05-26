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

const defaultData: DbSchema = {
  contacts: [],
  conversations: [],
  messages: [],
};

let dbInstance: Low<DbSchema> | null = null;

export async function getDb(): Promise<Low<DbSchema>> {
  if (dbInstance) return dbInstance;
  const dbPath = path.join(process.cwd(), "data", "db.json");
  dbInstance = await JSONFilePreset<DbSchema>(dbPath, defaultData);
  return dbInstance;
}

export async function findOrCreateConversation(
  phone: string,
  name: string
): Promise<{ contact: Contact; conversation: Conversation }> {
  const db = await getDb();
  await db.read();

  let contact = db.data.contacts.find((c) => c.phone === phone);
  if (!contact) {
    contact = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      phone,
      name,
      status: "new",
      stage: "greeting",
      appointmentData: {},
      createdAt: new Date().toISOString(),
      lastContactAt: new Date().toISOString(),
    };
    db.data.contacts.push(contact);
  } else {
    contact.lastContactAt = new Date().toISOString();
  }

  let conversation = db.data.conversations.find((cv) => cv.contactId === contact!.id);
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
    db.data.conversations.push(conversation);
  }

  await db.write();
  return { contact, conversation };
}

export async function addMessage(
  conversationId: string,
  from: Message["from"],
  content: string,
  waMessageId?: string
): Promise<Message> {
  const db = await getDb();
  await db.read();

  const message: Message = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    conversationId,
    from,
    content,
    timestamp: new Date().toISOString(),
    waMessageId,
  };

  db.data.messages.push(message);

  const conv = db.data.conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.messageCount += 1;
    conv.lastMessageAt = message.timestamp;
    conv.lastMessage = content.slice(0, 80);
    if (from === "customer") conv.isRead = false;
  }

  await db.write();
  return message;
}

export async function updateContact(
  contactId: string,
  updates: Partial<Pick<Contact, "status" | "stage" | "appointmentData" | "name">>
): Promise<void> {
  const db = await getDb();
  await db.read();

  const contact = db.data.contacts.find((c) => c.id === contactId);
  if (contact) Object.assign(contact, updates);

  const conv = db.data.conversations.find((c) => c.contactId === contactId);
  if (conv) {
    if (updates.status) conv.status = updates.status;
    if (updates.stage) conv.stage = updates.stage;
    if (updates.appointmentData) conv.appointmentData = { ...conv.appointmentData, ...updates.appointmentData };
    if (updates.name && updates.name !== "Unknown") {
      conv.contactName = updates.name;
      if (contact) contact.name = updates.name;
    }
  }

  await db.write();
}
