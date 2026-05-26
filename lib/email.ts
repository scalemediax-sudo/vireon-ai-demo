import nodemailer from "nodemailer";
import { AppointmentData } from "@/lib/db";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendAppointmentEmail(
  appointment: AppointmentData & { confirmedDatetime: string }
): Promise<void> {
  const transporter = getTransporter();
  const clinicEmail = process.env.CLINIC_OWNER_EMAIL ?? process.env.GMAIL_USER;

  if (!transporter || !clinicEmail) {
    console.log("[Email MOCK] New appointment:", appointment);
    return;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px">
      <div style="background:#0f172a;padding:16px 24px;border-radius:8px;margin-bottom:24px">
        <h2 style="color:#fff;margin:0;font-size:18px">🏥 New Appointment Booked</h2>
        <p style="color:rgba(255,255,255,0.5);margin:4px 0 0;font-size:13px">via Vireon AI WhatsApp Agent</p>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:12px 0;font-size:13px;color:#6b7280;width:120px">Patient</td>
          <td style="padding:12px 0;font-size:14px;color:#111827;font-weight:600">${appointment.name}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:12px 0;font-size:13px;color:#6b7280">Phone</td>
          <td style="padding:12px 0;font-size:14px;color:#111827">${appointment.phone}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:12px 0;font-size:13px;color:#6b7280">Concern</td>
          <td style="padding:12px 0;font-size:14px;color:#111827">${appointment.concern}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;font-size:13px;color:#6b7280">Appointment</td>
          <td style="padding:12px 0;font-size:14px;color:#059669;font-weight:600">✅ ${appointment.confirmedDatetime}</td>
        </tr>
      </table>
      <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center">
        Booked automatically by Vireon AI • vireonai.com
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Vireon AI" <${process.env.GMAIL_USER}>`,
      to: clinicEmail,
      subject: `📅 New Appointment — ${appointment.name} on ${appointment.confirmedDatetime}`,
      html,
    });
    console.log("[Email] Appointment notification sent to", clinicEmail);
  } catch (e) {
    console.error("[Email] Send failed:", e);
  }
}
