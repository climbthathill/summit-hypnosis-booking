import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmation, sendOwnerNotification } from "@/lib/email";
import { getBusySlots } from "@/lib/google-calendar";
import { isValidSlot } from "@/lib/availability";
import { addMinutes, addHours, addDays } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, sessionType, startTime } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !sessionType || !startTime) {
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }
    if (!["online", "in-person"].includes(sessionType)) {
      return Response.json({ error: "Invalid session type" }, { status: 400 });
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return Response.json({ error: "Invalid start time" }, { status: 400 });
    }
    if (!isValidSlot(start)) {
      return Response.json(
        { error: "Selected time is outside business hours or not a working day" },
        { status: 400 }
      );
    }

    const end = addMinutes(start, 60);

    // Verify the slot is still available
    const busy = await getBusySlots(start);
    const conflict = busy.some((b) => start < b.end && end > b.start);
    if (conflict) {
      return Response.json(
        { error: "This time slot is no longer available. Please select another." },
        { status: 409 }
      );
    }

    // Create Google Calendar event
    const { eventId, meetLink } = await createCalendarEvent({
      firstName,
      lastName,
      email,
      phone,
      sessionType,
      startTime: start,
      endTime: end,
    });

    // Persist booking
    const booking = await prisma.booking.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        sessionType,
        startTime: start,
        endTime: end,
        googleEventId: eventId,
        meetLink,
      },
    });

    // Schedule reminder emails
    const oneDayBefore = addDays(start, -1);
    const oneHourBefore = addHours(start, -1);

    await prisma.reminder.createMany({
      data: [
        { bookingId: booking.id, sendAt: oneDayBefore, type: "1day" },
        { bookingId: booking.id, sendAt: oneHourBefore, type: "1hour" },
      ],
    });

    // Send confirmation emails
    await Promise.all([
      sendBookingConfirmation({ firstName, lastName, email, sessionType, startTime: start, meetLink }),
      sendOwnerNotification({ firstName, lastName, email, phone, sessionType, startTime: start }),
    ]);

    return Response.json({
      id: booking.id,
      startTime: start.toISOString(),
      meetLink,
      sessionType,
    });
  } catch (err) {
    console.error("Booking error:", err);
    return Response.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
