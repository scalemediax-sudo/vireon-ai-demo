import { NextResponse } from "next/server";
import { writeData, Contact, Conversation, Message, LeadStatus, ConversationStage, AppointmentData } from "@/lib/db";
import { subDays, subHours, subMinutes, addDays, format } from "date-fns";

interface DemoConv {
  name: string; phone: string; status: LeadStatus; stage: ConversationStage;
  appointmentData: AppointmentData; messages: { from: string; text: string }[]; daysAgo: number;
}

export async function POST() {
  try {
    const now = new Date();
    const apt = (daysAhead: number, time: string) =>
      format(addDays(now, daysAhead), `EEEE, d MMM 'at' '${time}'`);

    const DEMO: DemoConv[] = [
      {
        name: "Priya Sharma", phone: "919876543210", status: "booked", stage: "confirmed",
        appointmentData: { name: "Priya Sharma", concern: "Severe back pain", phone: "919876543210", confirmedDatetime: apt(2, "11:00 AM") },
        messages: [
          { from: "customer", text: "Hi" },
          { from: "bot", text: "Hello! 👋 Welcome to our clinic. Are you looking to book an appointment?" },
          { from: "customer", text: "Yes" },
          { from: "bot", text: "Great! Could you please share your full name?" },
          { from: "customer", text: "Priya Sharma" },
          { from: "bot", text: "Thanks Priya! What is your concern or reason for the appointment?" },
          { from: "customer", text: "I have severe back pain for the last 3 days" },
          { from: "bot", text: "Understood. What's the best phone number to reach you at?" },
          { from: "customer", text: "919876543210" },
          { from: "bot", text: "What date and time would you prefer? We're open Mon–Sat, 9am–7pm." },
          { from: "customer", text: "Day after tomorrow 11am" },
          { from: "bot", text: `✅ *Appointment Confirmed!*\n\n👤 *Patient:* Priya Sharma\n🩺 *Concern:* Severe back pain\n📅 *Date & Time:* ${apt(2, "11:00 AM")}\n📞 *Phone:* 919876543210\n\nPlease arrive 5 minutes early. See you soon! 🏥` },
        ], daysAgo: 1,
      },
      {
        name: "Rahul Verma", phone: "919811223344", status: "booked", stage: "confirmed",
        appointmentData: { name: "Rahul Verma", concern: "Fever and cough for 4 days", phone: "9811223344", confirmedDatetime: apt(3, "2:00 PM") },
        messages: [
          { from: "customer", text: "Hello, I need to see a doctor" },
          { from: "bot", text: "Hello! 👋 Are you looking to book an appointment?" },
          { from: "customer", text: "Yes please" },
          { from: "bot", text: "Great! Could you share your full name?" },
          { from: "customer", text: "Rahul Verma" },
          { from: "bot", text: "Thanks Rahul! What is your concern?" },
          { from: "customer", text: "Fever and cough for 4 days" },
          { from: "bot", text: "Noted. What's your contact number?" },
          { from: "customer", text: "9811223344" },
          { from: "bot", text: "What date and time works? Mon–Sat, 9am–7pm." },
          { from: "customer", text: "3 days from now, 2pm" },
          { from: "bot", text: `✅ *Appointment Confirmed!*\n\n👤 *Patient:* Rahul Verma\n🩺 *Concern:* Fever and cough\n📅 *Date & Time:* ${apt(3, "2:00 PM")}\n\nSee you soon! 🏥` },
        ], daysAgo: 2,
      },
      {
        name: "Anita Desai", phone: "919988776655", status: "warm", stage: "collecting_phone",
        appointmentData: { name: "Anita Desai", concern: "Knee pain and swelling" },
        messages: [
          { from: "customer", text: "I want to book appointment" },
          { from: "bot", text: "Hello! 👋 Are you looking to book an appointment?" },
          { from: "customer", text: "Yes" },
          { from: "bot", text: "Could you share your full name?" },
          { from: "customer", text: "Anita Desai" },
          { from: "bot", text: "Thanks Anita! What is your concern?" },
          { from: "customer", text: "Knee pain and swelling since last week" },
          { from: "bot", text: "Understood. What's the best phone number to reach you at?" },
        ], daysAgo: 0,
      },
      {
        name: "Suresh Patel", phone: "919777888999", status: "warm", stage: "collecting_datetime",
        appointmentData: { name: "Suresh Patel", concern: "Diabetes checkup and monitoring", phone: "919777888999" },
        messages: [
          { from: "customer", text: "Hi need appointment" },
          { from: "bot", text: "Hello! 👋 Are you looking to book an appointment?" },
          { from: "customer", text: "Yes" },
          { from: "bot", text: "Could you share your name?" },
          { from: "customer", text: "Suresh Patel" },
          { from: "bot", text: "What is your concern?" },
          { from: "customer", text: "Diabetes checkup and blood sugar monitoring" },
          { from: "bot", text: "Noted. What's your phone number?" },
          { from: "customer", text: "9777888999" },
          { from: "bot", text: "What date and time works? Mon–Sat, 9am–7pm." },
        ], daysAgo: 1,
      },
      {
        name: "Meera Joshi", phone: "919666555444", status: "not_interested", stage: "declined",
        appointmentData: {},
        messages: [
          { from: "customer", text: "Hello" },
          { from: "bot", text: "Hello! 👋 Are you looking to book an appointment?" },
          { from: "customer", text: "No, just had a question about timing" },
          { from: "bot", text: "We're open Mon–Sat from 9am to 7pm. Feel free to reach out anytime! Take care 🙏" },
        ], daysAgo: 3,
      },
      {
        name: "Kiran Mehta", phone: "919555444333", status: "booked", stage: "confirmed",
        appointmentData: { name: "Kiran Mehta", concern: "Skin allergy and rash", phone: "9555444333", confirmedDatetime: apt(1, "10:00 AM") },
        messages: [
          { from: "customer", text: "I need to see dermatologist" },
          { from: "bot", text: "Hello! 👋 Are you looking to book an appointment?" },
          { from: "customer", text: "Yes urgently" },
          { from: "bot", text: "Could you share your full name?" },
          { from: "customer", text: "Kiran Mehta" },
          { from: "bot", text: "What is your concern?" },
          { from: "customer", text: "Skin allergy and rash, getting worse" },
          { from: "bot", text: "What's your contact number?" },
          { from: "customer", text: "9555444333" },
          { from: "bot", text: "What date and time works?" },
          { from: "customer", text: "Tomorrow 10am" },
          { from: "bot", text: `✅ *Appointment Confirmed!*\n\n👤 *Patient:* Kiran Mehta\n🩺 *Concern:* Skin allergy\n📅 *Date & Time:* ${apt(1, "10:00 AM")}\n\nSee you soon! 🏥` },
        ], daysAgo: 0,
      },
      {
        name: "Deepak Nair", phone: "919444333222", status: "warm", stage: "collecting_concern",
        appointmentData: { name: "Deepak Nair" },
        messages: [
          { from: "customer", text: "Hi" },
          { from: "bot", text: "Hello! 👋 Are you looking to book an appointment?" },
          { from: "customer", text: "Yes" },
          { from: "bot", text: "Could you share your full name?" },
          { from: "customer", text: "Deepak Nair" },
          { from: "bot", text: "Thanks Deepak! What is your concern or reason for the appointment?" },
        ], daysAgo: 0,
      },
      {
        name: "Sonia Gupta", phone: "919333222111", status: "new", stage: "greeting",
        appointmentData: {},
        messages: [
          { from: "customer", text: "Hello" },
          { from: "bot", text: "Hello! 👋 Welcome to our clinic. Are you looking to book an appointment?" },
        ], daysAgo: 0,
      },
    ];

    const contacts: Contact[] = [];
    const conversations: Conversation[] = [];
    const messages: Message[] = [];

    for (const demo of DEMO) {
      const base = subDays(now, demo.daysAgo);
      const cId = `c_demo_${demo.phone}`;
      const cvId = `cv_demo_${demo.phone}`;

      contacts.push({
        id: cId, phone: demo.phone, name: demo.name,
        status: demo.status, stage: demo.stage,
        appointmentData: demo.appointmentData,
        createdAt: base.toISOString(),
        lastContactAt: subHours(now, demo.daysAgo * 2).toISOString(),
      });

      const lastMsg = demo.messages[demo.messages.length - 1];
      conversations.push({
        id: cvId, contactId: cId, contactPhone: demo.phone, contactName: demo.name,
        status: demo.status, stage: demo.stage, appointmentData: demo.appointmentData,
        messageCount: demo.messages.length,
        lastMessageAt: subHours(now, demo.daysAgo * 2).toISOString(),
        lastMessage: lastMsg.text.slice(0, 80),
        createdAt: base.toISOString(),
        isRead: demo.status !== "warm",
      });

      demo.messages.forEach((m, i) => {
        messages.push({
          id: `m_demo_${demo.phone}_${i}`,
          conversationId: cvId,
          from: m.from as "bot" | "human" | "customer",
          content: m.text,
          timestamp: subMinutes(subHours(now, demo.daysAgo * 2), (demo.messages.length - i) * 4).toISOString(),
        });
      });
    }

    await writeData({ contacts, conversations, messages });
    return NextResponse.json({ success: true, seeded: DEMO.length });
  } catch (err) {
    console.error("[Seed]", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
