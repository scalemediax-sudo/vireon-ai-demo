import { NextResponse } from "next/server";
import { getDb, Contact, Conversation, Message, LeadStatus, ConversationStage, AppointmentData } from "@/lib/db";
import { subDays, subHours, subMinutes } from "date-fns";

interface DemoConv {
  name: string;
  phone: string;
  status: LeadStatus;
  stage: ConversationStage;
  appointmentData: AppointmentData;
  messages: { from: string; text: string }[];
  daysAgo: number;
}

const DEMO_CONVERSATIONS: DemoConv[] = [
  {
    name: "Priya Sharma",
    phone: "919876543210",
    status: "booked",
    stage: "confirmed",
    appointmentData: {
      name: "Priya Sharma",
      concern: "Severe back pain",
      phone: "919876543210",
      preferredDatetime: "Tomorrow 11am",
      confirmedDatetime: "Wednesday, 28 May at 11:00 AM",
    },
    messages: [
      { from: "customer", text: "Hi" },
      { from: "bot", text: "Hello! 👋 Welcome to our clinic. Are you looking to book an appointment?" },
      { from: "customer", text: "Yes" },
      { from: "bot", text: "Great! Happy to help. Could you please share your full name?" },
      { from: "customer", text: "Priya Sharma" },
      { from: "bot", text: "Thanks, Priya Sharma! What is your concern or reason for the appointment?" },
      { from: "customer", text: "I have severe back pain for the last 3 days" },
      { from: "bot", text: "Understood. What's the best phone number to reach you at?" },
      { from: "customer", text: "919876543210" },
      { from: "bot", text: "Thank you! What date and time would you prefer? We're open Mon–Sat, 9am–7pm." },
      { from: "customer", text: "Tomorrow 11am" },
      { from: "bot", text: "✅ *Appointment Confirmed!*\n\n👤 *Patient:* Priya Sharma\n🩺 *Concern:* Severe back pain\n📅 *Date & Time:* Wednesday, 28 May at 11:00 AM\n📞 *Phone:* 919876543210\n\nPlease arrive 5 minutes early. See you soon! 🏥" },
    ],
    daysAgo: 1,
  },
  {
    name: "Rahul Verma",
    phone: "919811223344",
    status: "booked",
    stage: "confirmed",
    appointmentData: {
      name: "Rahul Verma",
      concern: "Fever and cough for 4 days",
      phone: "919811223344",
      confirmedDatetime: "Thursday, 29 May at 2:00 PM",
    },
    messages: [
      { from: "customer", text: "Hello, I need to see a doctor" },
      { from: "bot", text: "Hello! 👋 Welcome to our clinic. Are you looking to book an appointment?" },
      { from: "customer", text: "Yes please" },
      { from: "bot", text: "Great! Could you please share your full name?" },
      { from: "customer", text: "Rahul Verma" },
      { from: "bot", text: "Thanks, Rahul! What is your concern or reason for the appointment?" },
      { from: "customer", text: "Fever and cough for 4 days" },
      { from: "bot", text: "Understood. What's the best phone number to reach you at?" },
      { from: "customer", text: "9811223344" },
      { from: "bot", text: "What date and time would you prefer? We're open Mon–Sat, 9am–7pm." },
      { from: "customer", text: "Thursday 2pm" },
      { from: "bot", text: "✅ *Appointment Confirmed!*\n\n👤 *Patient:* Rahul Verma\n🩺 *Concern:* Fever and cough\n📅 *Date & Time:* Thursday, 29 May at 2:00 PM\n📞 *Phone:* 9811223344\n\nPlease arrive 5 minutes early. See you soon! 🏥" },
    ],
    daysAgo: 2,
  },
  {
    name: "Anita Desai",
    phone: "919988776655",
    status: "warm",
    stage: "collecting_phone",
    appointmentData: {
      name: "Anita Desai",
      concern: "Knee pain and swelling",
    },
    messages: [
      { from: "customer", text: "I want to book appointment" },
      { from: "bot", text: "Hello! 👋 Welcome to our clinic. Are you looking to book an appointment?" },
      { from: "customer", text: "Yes" },
      { from: "bot", text: "Great! Could you please share your full name?" },
      { from: "customer", text: "Anita Desai" },
      { from: "bot", text: "Thanks, Anita! What is your concern or reason for the appointment?" },
      { from: "customer", text: "Knee pain and swelling since last week" },
      { from: "bot", text: "Understood. What's the best phone number to reach you at?" },
    ],
    daysAgo: 0,
  },
  {
    name: "Suresh Patel",
    phone: "919777888999",
    status: "warm",
    stage: "collecting_datetime",
    appointmentData: {
      name: "Suresh Patel",
      concern: "Diabetes checkup",
      phone: "919777888999",
    },
    messages: [
      { from: "customer", text: "Hi need appointment" },
      { from: "bot", text: "Hello! 👋 Are you looking to book an appointment with our clinic?" },
      { from: "customer", text: "Yes" },
      { from: "bot", text: "Great! Could you share your full name?" },
      { from: "customer", text: "Suresh Patel" },
      { from: "bot", text: "Thanks Suresh! What is your concern?" },
      { from: "customer", text: "Diabetes checkup and blood sugar monitoring" },
      { from: "bot", text: "Noted. What's your phone number?" },
      { from: "customer", text: "9777888999" },
      { from: "bot", text: "What date and time works for you? Mon–Sat, 9am–7pm." },
    ],
    daysAgo: 1,
  },
  {
    name: "Meera Joshi",
    phone: "919666555444",
    status: "not_interested",
    stage: "declined",
    appointmentData: {},
    messages: [
      { from: "customer", text: "Hello" },
      { from: "bot", text: "Hello! 👋 Welcome to our clinic. Are you looking to book an appointment?" },
      { from: "customer", text: "No, just had a question about timing" },
      { from: "bot", text: "We're open Mon–Sat from 9am to 7pm. Feel free to reach out whenever you need us! Take care 🙏" },
    ],
    daysAgo: 3,
  },
  {
    name: "Kiran Mehta",
    phone: "919555444333",
    status: "booked",
    stage: "confirmed",
    appointmentData: {
      name: "Kiran Mehta",
      concern: "Skin allergy and rash",
      phone: "919555444333",
      confirmedDatetime: "Friday, 30 May at 10:00 AM",
    },
    messages: [
      { from: "customer", text: "I need to see dermatologist" },
      { from: "bot", text: "Hello! 👋 Are you looking to book an appointment with our clinic?" },
      { from: "customer", text: "Yes urgently" },
      { from: "bot", text: "Of course! Could you share your full name?" },
      { from: "customer", text: "Kiran Mehta" },
      { from: "bot", text: "Thanks Kiran! What is your concern?" },
      { from: "customer", text: "Skin allergy and rash, getting worse" },
      { from: "bot", text: "Understood. What's your contact number?" },
      { from: "customer", text: "9555444333" },
      { from: "bot", text: "What date and time works for you?" },
      { from: "customer", text: "Friday 10am" },
      { from: "bot", text: "✅ *Appointment Confirmed!*\n\n👤 *Patient:* Kiran Mehta\n🩺 *Concern:* Skin allergy and rash\n📅 *Date & Time:* Friday, 30 May at 10:00 AM\n📞 *Phone:* 9555444333\n\nSee you soon! 🏥" },
    ],
    daysAgo: 5,
  },
  {
    name: "Deepak Nair",
    phone: "919444333222",
    status: "warm",
    stage: "collecting_concern",
    appointmentData: {
      name: "Deepak Nair",
    },
    messages: [
      { from: "customer", text: "Hi" },
      { from: "bot", text: "Hello! 👋 Welcome to our clinic. Are you looking to book an appointment?" },
      { from: "customer", text: "Yes" },
      { from: "bot", text: "Great! Could you please share your full name?" },
      { from: "customer", text: "Deepak Nair" },
      { from: "bot", text: "Thanks, Deepak! What is your concern or reason for the appointment?" },
    ],
    daysAgo: 0,
  },
  {
    name: "Sonia Gupta",
    phone: "919333222111",
    status: "new",
    stage: "greeting",
    appointmentData: {},
    messages: [
      { from: "customer", text: "Hello" },
      { from: "bot", text: "Hello! 👋 Welcome to our clinic. Are you looking to book an appointment?" },
    ],
    daysAgo: 0,
  },
];

export async function POST() {
  try {
    const db = await getDb();
    await db.read();

    db.data.contacts = [];
    db.data.conversations = [];
    db.data.messages = [];

    for (const demo of DEMO_CONVERSATIONS) {
      const now = new Date();
      const baseTime = subDays(now, demo.daysAgo);

      const contactId = `c_demo_${demo.phone}`;
      const convId = `cv_demo_${demo.phone}`;

      const contact: Contact = {
        id: contactId,
        phone: demo.phone,
        name: demo.name,
        status: demo.status,
        stage: demo.stage,
        appointmentData: demo.appointmentData,
        createdAt: baseTime.toISOString(),
        lastContactAt: subHours(now, demo.daysAgo * 2).toISOString(),
      };

      const lastMsg = demo.messages[demo.messages.length - 1];
      const conversation: Conversation = {
        id: convId,
        contactId,
        contactPhone: demo.phone,
        contactName: demo.name,
        status: demo.status,
        stage: demo.stage,
        appointmentData: demo.appointmentData,
        messageCount: demo.messages.length,
        lastMessageAt: subHours(now, demo.daysAgo * 2).toISOString(),
        lastMessage: lastMsg.text.slice(0, 80),
        createdAt: baseTime.toISOString(),
        isRead: demo.status !== "warm" || demo.stage !== "collecting_phone",
      };

      const messages: Message[] = demo.messages.map((m, i) => ({
        id: `m_demo_${demo.phone}_${i}`,
        conversationId: convId,
        from: m.from as "bot" | "human" | "customer",
        content: m.text,
        timestamp: subMinutes(subHours(now, demo.daysAgo * 2), (demo.messages.length - i) * 4).toISOString(),
      }));

      db.data.contacts.push(contact);
      db.data.conversations.push(conversation);
      db.data.messages.push(...messages);
    }

    await db.write();
    return NextResponse.json({ success: true, seeded: DEMO_CONVERSATIONS.length });
  } catch (err) {
    console.error("[Seed] Error:", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
