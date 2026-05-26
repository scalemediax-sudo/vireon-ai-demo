import { NextRequest, NextResponse } from "next/server";
import { parseWebhookPayload, sendWhatsAppMessage } from "@/lib/whatsapp";
import {
  findOrCreateConversation,
  addMessage,
  updateContact,
  getDb,
} from "@/lib/db";
import { runClinicAgent, parseDateTime } from "@/lib/clinic-agent";
import { checkAndBookSlot } from "@/lib/calendar";
import { sendAppointmentEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = parseWebhookPayload(body);

    for (const msg of messages) {
      const { contact, conversation } = await findOrCreateConversation(msg.from, msg.name);
      await addMessage(conversation.id, "customer", msg.text, msg.messageId);

      const currentStage = contact.stage;
      const appointmentData = { ...contact.appointmentData };

      // Run clinic agent to get next step
      const result = await runClinicAgent(
        currentStage,
        msg.text,
        appointmentData
      );

      let replyText = result.reply;
      let nextStage = result.nextStage;
      let dataUpdates = { ...result.updates };
      let newStatus = result.status;

      // After collecting datetime → check calendar availability
      if (currentStage === "collecting_datetime" || nextStage === "checking_availability") {
        const preferredStr = result.updates.preferredDatetime ?? appointmentData.preferredDatetime ?? msg.text;
        const parsedDate = parseDateTime(preferredStr);

        if (parsedDate) {
          const allData = { ...appointmentData, ...result.updates };
          const slotResult = await checkAndBookSlot(
            parsedDate,
            allData.name ?? "Patient",
            allData.concern ?? "General consultation",
            allData.phone ?? msg.from
          );

          if (slotResult.available && slotResult.confirmedSlot) {
            dataUpdates.confirmedDatetime = slotResult.confirmedSlot;
            nextStage = "confirmed";
            newStatus = "booked";

            replyText = `✅ *Appointment Confirmed!*\n\n👤 *Patient:* ${allData.name}\n🩺 *Concern:* ${allData.concern}\n📅 *Date & Time:* ${slotResult.confirmedSlot}\n📞 *Phone:* ${allData.phone}\n\nPlease arrive 5 minutes early. See you soon! 🏥`;

            // Send email notification
            await sendAppointmentEmail({
              ...allData,
              confirmedDatetime: slotResult.confirmedSlot,
            } as Parameters<typeof sendAppointmentEmail>[0]);
          } else if (!slotResult.available && slotResult.alternativeSlots?.length) {
            const alts = slotResult.alternativeSlots.slice(0, 2).join("\n• ");
            replyText = `That slot isn't available. Here are some options:\n\n• ${alts}\n\nWhich works for you?`;
            nextStage = "suggesting_alternative";
            dataUpdates.preferredDatetime = preferredStr;
          }
        }
      }

      // Handle suggesting_alternative → patient picks a slot
      if (currentStage === "suggesting_alternative") {
        const allData = { ...appointmentData, ...dataUpdates };
        const parsedDate = parseDateTime(msg.text);
        if (parsedDate) {
          const slotResult = await checkAndBookSlot(
            parsedDate,
            allData.name ?? "Patient",
            allData.concern ?? "General consultation",
            allData.phone ?? msg.from
          );
          if (slotResult.available && slotResult.confirmedSlot) {
            dataUpdates.confirmedDatetime = slotResult.confirmedSlot;
            nextStage = "confirmed";
            newStatus = "booked";
            replyText = `✅ *Appointment Confirmed!*\n\n👤 *Patient:* ${allData.name}\n🩺 *Concern:* ${allData.concern}\n📅 *Date & Time:* ${slotResult.confirmedSlot}\n📞 *Phone:* ${allData.phone}\n\nPlease arrive 5 minutes early. See you soon! 🏥`;

            await sendAppointmentEmail({
              ...allData,
              confirmedDatetime: slotResult.confirmedSlot,
            } as Parameters<typeof sendAppointmentEmail>[0]);
          }
        }
      }

      // Save updates to contact
      await updateContact(contact.id, {
        stage: nextStage,
        status: newStatus === "booked" ? "booked" : newStatus === "not_interested" ? "not_interested" : newStatus === "warm" ? "warm" : contact.status,
        appointmentData: { ...appointmentData, ...dataUpdates },
        ...(dataUpdates.name ? { name: dataUpdates.name } : {}),
      });

      // Send reply
      const waId = await sendWhatsAppMessage(msg.from, replyText);
      await addMessage(conversation.id, "bot", replyText, waId ?? undefined);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
