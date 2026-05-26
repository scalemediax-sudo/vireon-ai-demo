import { NextResponse } from "next/server";
import { getDb, Contact, Conversation, Message, LeadStatus } from "@/lib/db";
import { subDays, subHours, subMinutes } from "date-fns";

const DEMO_CONVERSATIONS = [
  {
    name: "Raj Mehta",
    phone: "919876543210",
    status: "booked" as LeadStatus,
    messages: [
      { from: "customer", text: "Hi, I saw your ad about AI for business" },
      { from: "bot", text: "Hey Raj! 👋 Thanks for reaching out to Vireon AI. What kind of business do you run?" },
      { from: "customer", text: "I run a digital marketing agency, about 3 years old" },
      { from: "bot", text: "That's great! What's your biggest challenge right now when it comes to getting new clients?" },
      { from: "customer", text: "We get leads but they don't respond or we lose track of follow ups" },
      { from: "bot", text: "I totally get that. Are you currently running any ads on Meta or Google?" },
      { from: "customer", text: "Yes Meta ads mostly, spending about 50k per month" },
      { from: "bot", text: "Perfect. We automate your entire lead follow-up with AI — so no lead ever slips through. Would you be open to a quick 20-min call to see if it's a fit?\n\nBook your free call here: https://calendly.com/vireon-ai" },
      { from: "customer", text: "Yes sure I'll book it" },
    ],
    daysAgo: 1,
  },
  {
    name: "Priya Singh",
    phone: "919811223344",
    status: "hot" as LeadStatus,
    messages: [
      { from: "customer", text: "Hello, interested in AI automation" },
      { from: "bot", text: "Hey Priya! 👋 Thanks for reaching out to Vireon AI. What kind of business do you run?" },
      { from: "customer", text: "Real estate agency, we deal in commercial properties" },
      { from: "bot", text: "That's great! What's your biggest challenge right now when it comes to getting new clients?" },
      { from: "customer", text: "Too many leads, not enough time to follow up manually" },
      { from: "bot", text: "I totally get that. Are you currently running any ads on Meta or Google?" },
      { from: "customer", text: "Both actually, Google for search and Meta for retargeting" },
    ],
    daysAgo: 2,
  },
  {
    name: "Amit Kumar",
    phone: "919988776655",
    status: "warm" as LeadStatus,
    messages: [
      { from: "customer", text: "Hey what does your service do exactly?" },
      { from: "bot", text: "Hey Amit! 👋 We build AI agents that qualify your leads on WhatsApp and book appointments automatically. What kind of business do you run?" },
      { from: "customer", text: "I have a coaching business, life coaching" },
      { from: "bot", text: "Nice! What's your biggest challenge right now when it comes to getting new clients?" },
      { from: "customer", text: "Getting consistent leads honestly" },
    ],
    daysAgo: 3,
  },
  {
    name: "Sneha Patel",
    phone: "919777888999",
    status: "not_interested" as LeadStatus,
    messages: [
      { from: "customer", text: "Hi" },
      { from: "bot", text: "Hey Sneha! 👋 Thanks for reaching out to Vireon AI. What kind of business do you run?" },
      { from: "customer", text: "Small bakery, just wanted to know prices" },
      { from: "bot", text: "That's lovely! We specialize in AI lead automation for service businesses. What challenges do you face getting new customers?" },
      { from: "customer", text: "Not really interested, too expensive for me probably" },
      { from: "bot", text: "Totally understand! No worries at all. Feel free to reach out whenever you're ready. Best of luck with the bakery! 🎂" },
    ],
    daysAgo: 5,
  },
  {
    name: "Vikram Sharma",
    phone: "919666555444",
    status: "cold" as LeadStatus,
    messages: [
      { from: "customer", text: "Saw your ad" },
      { from: "bot", text: "Hey Vikram! 👋 Thanks for reaching out to Vireon AI. What kind of business do you run?" },
      { from: "customer", text: "Just browsing" },
    ],
    daysAgo: 7,
  },
  {
    name: "Deepika Nair",
    phone: "919555444333",
    status: "booked" as LeadStatus,
    messages: [
      { from: "customer", text: "Hi I want to automate my business" },
      { from: "bot", text: "Hey Deepika! 👋 Vireon AI here. What kind of business do you run?" },
      { from: "customer", text: "I run a fitness studio chain, 4 locations" },
      { from: "bot", text: "Amazing! What's your biggest challenge with getting new clients?" },
      { from: "customer", text: "New members sign up but then don't follow through. Need automation badly" },
      { from: "bot", text: "We can fix that! Our AI follows up with every lead automatically. Want to see a demo? Here's the link: https://calendly.com/vireon-ai" },
      { from: "customer", text: "Booked for Thursday!" },
    ],
    daysAgo: 10,
  },
  {
    name: "Rohit Joshi",
    phone: "919444333222",
    status: "warm" as LeadStatus,
    messages: [
      { from: "customer", text: "Hello" },
      { from: "bot", text: "Hey Rohit! 👋 Thanks for reaching out. What kind of business do you run?" },
      { from: "customer", text: "IT consulting, 10 member team" },
      { from: "bot", text: "Nice! What's your biggest pain point with client acquisition?" },
      { from: "customer", text: "Cold outreach is killing us, very low conversion" },
    ],
    daysAgo: 12,
  },
  {
    name: "Ananya Reddy",
    phone: "919333222111",
    status: "hot" as LeadStatus,
    messages: [
      { from: "customer", text: "I need an AI agent for my solar business" },
      { from: "bot", text: "Hey Ananya! 👋 Perfect timing. What scale are you at currently?" },
      { from: "customer", text: "We do about 50 installations per month, want to scale to 150" },
      { from: "bot", text: "That's ambitious! Are you running ads currently?" },
      { from: "customer", text: "Yes Meta and YouTube, spending 2L per month" },
      { from: "bot", text: "With that ad spend you need AI follow-up urgently or you're leaving money on the table. Shall we get on a call? https://calendly.com/vireon-ai" },
      { from: "customer", text: "Sending me the link to book" },
    ],
    daysAgo: 4,
  },
];

export async function POST() {
  try {
    const db = await getDb();
    await db.read();

    // Clear existing demo data
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
        messageCount: demo.messages.length,
        lastMessageAt: subHours(now, demo.daysAgo * 2).toISOString(),
        lastMessage: lastMsg.text.slice(0, 80),
        createdAt: baseTime.toISOString(),
        isRead: demo.status !== "hot",
      };

      const messages: Message[] = demo.messages.map((m, i) => ({
        id: `m_demo_${demo.phone}_${i}`,
        conversationId: convId,
        from: m.from as "bot" | "human" | "customer",
        content: m.text,
        timestamp: subMinutes(subHours(now, demo.daysAgo * 2), (demo.messages.length - i) * 3).toISOString(),
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
