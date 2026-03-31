import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminder } from "@/lib/email";

// This endpoint is called by an external cron job (e.g. every 5 minutes)
// Protected by a secret token in the Authorization header
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all unsent reminders that are due
  const dueReminders = await prisma.reminder.findMany({
    where: {
      sent: false,
      sendAt: { lte: now },
    },
    include: {
      booking: true,
    },
  });

  const results: { id: string; status: string }[] = [];

  for (const reminder of dueReminders) {
    const { booking } = reminder;

    // Skip cancelled bookings
    if (booking.status === "cancelled") {
      await prisma.reminder.update({ where: { id: reminder.id }, data: { sent: true } });
      results.push({ id: reminder.id, status: "skipped (cancelled)" });
      continue;
    }

    try {
      await sendReminder({
        firstName: booking.firstName,
        email: booking.email,
        sessionType: booking.sessionType,
        startTime: booking.startTime,
        meetLink: booking.meetLink,
        type: reminder.type as "1day" | "1hour",
      });

      await prisma.reminder.update({ where: { id: reminder.id }, data: { sent: true } });
      results.push({ id: reminder.id, status: "sent" });
    } catch (err) {
      console.error(`Failed to send reminder ${reminder.id}:`, err);
      results.push({ id: reminder.id, status: "error" });
    }
  }

  return Response.json({ processed: results.length, results });
}
