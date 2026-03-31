import nodemailer from "nodemailer";
import { format } from "date-fns";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function formatTime(date: Date) {
  return format(date, "EEEE, MMMM d yyyy 'at' h:mm a");
}

export async function sendBookingConfirmation({
  firstName,
  lastName,
  email,
  sessionType,
  startTime,
  meetLink,
}: {
  firstName: string;
  lastName: string;
  email: string;
  sessionType: string;
  startTime: Date;
  meetLink: string | null;
}) {
  const sessionLabel = sessionType === "online" ? "Online via Google Meet" : "In-Person (Gold Coast)";
  const locationHtml =
    sessionType === "online" && meetLink
      ? `<p><strong>Meeting link:</strong> <a href="${meetLink}">${meetLink}</a></p>`
      : `<p><strong>Location:</strong> Gold Coast (address will be provided by Ole)</p>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Your Summit Hypnosis Session is Confirmed",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Booking Confirmed</h2>
        <p>Hi ${firstName},</p>
        <p>Your hypnosis session with Ole Hill has been confirmed.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Date & Time:</strong> ${formatTime(startTime)}</p>
        <p><strong>Duration:</strong> 1 hour</p>
        <p><strong>Session Type:</strong> ${sessionLabel}</p>
        ${locationHtml}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p>You will receive a reminder email 24 hours before and again 1 hour before your session.</p>
        <p>If you need to reschedule or cancel, please contact Ole directly at <a href="mailto:ole@summithypnosis.net">ole@summithypnosis.net</a>.</p>
        <br />
        <p>Looking forward to seeing you,<br /><strong>Ole Hill</strong><br />Summit Hypnosis</p>
      </div>
    `,
  });
}

export async function sendOwnerNotification({
  firstName,
  lastName,
  email,
  phone,
  sessionType,
  startTime,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sessionType: string;
  startTime: Date;
}) {
  const sessionLabel = sessionType === "online" ? "Online" : "In-Person (Gold Coast)";

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.OWNER_EMAIL,
    subject: `New Booking: ${firstName} ${lastName} – ${format(startTime, "MMM d, h:mm a")}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Session Booked</h2>
        <p><strong>Client:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Date & Time:</strong> ${formatTime(startTime)}</p>
        <p><strong>Session Type:</strong> ${sessionLabel}</p>
      </div>
    `,
  });
}

export async function sendReminder({
  firstName,
  email,
  sessionType,
  startTime,
  meetLink,
  type,
}: {
  firstName: string;
  email: string;
  sessionType: string;
  startTime: Date;
  meetLink: string | null;
  type: "1day" | "1hour";
}) {
  const sessionLabel = sessionType === "online" ? "Online via Google Meet" : "In-Person (Gold Coast)";
  const timeLabel = type === "1day" ? "tomorrow" : "in 1 hour";
  const subject =
    type === "1day"
      ? `Reminder: Your Hypnosis Session is Tomorrow`
      : `Reminder: Your Hypnosis Session is in 1 Hour`;

  const locationHtml =
    sessionType === "online" && meetLink
      ? `<p><strong>Meeting link:</strong> <a href="${meetLink}">${meetLink}</a></p>`
      : `<p><strong>Location:</strong> Gold Coast (address provided by Ole)</p>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Session Reminder</h2>
        <p>Hi ${firstName},</p>
        <p>This is a reminder that your hypnosis session with Ole Hill is <strong>${timeLabel}</strong>.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Date & Time:</strong> ${formatTime(startTime)}</p>
        <p><strong>Duration:</strong> 1 hour</p>
        <p><strong>Session Type:</strong> ${sessionLabel}</p>
        ${locationHtml}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p>If you need to reschedule or cancel, please contact Ole at <a href="mailto:ole@summithypnosis.net">ole@summithypnosis.net</a>.</p>
        <br />
        <p>See you soon,<br /><strong>Ole Hill</strong><br />Summit Hypnosis</p>
      </div>
    `,
  });
}
