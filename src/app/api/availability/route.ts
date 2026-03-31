import { NextRequest } from "next/server";
import { getBusySlots, getCalendarEvents } from "@/lib/google-calendar";
import { getAvailableSlots } from "@/lib/availability";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const weekParam = searchParams.get("week"); // ISO date string for start of week

  try {
    if (weekParam) {
      // Return slots for 7 days starting from weekParam
      const weekStart = new Date(weekParam);
      if (isNaN(weekStart.getTime())) {
        return Response.json({ error: "Invalid week date" }, { status: 400 });
      }

      const weekEnd = addDays(weekStart, 6);

      // Fetch all events for the week in one API call
      const events = await getCalendarEvents(startOfDay(weekStart), endOfDay(weekEnd));
      const busyByDay: Record<string, { start: Date; end: Date }[]> = {};

      for (const e of events) {
        if (!e.start?.dateTime || !e.end?.dateTime) continue;
        const dayKey = startOfDay(new Date(e.start.dateTime)).toISOString();
        if (!busyByDay[dayKey]) busyByDay[dayKey] = [];
        busyByDay[dayKey].push({
          start: new Date(e.start.dateTime),
          end: new Date(e.end.dateTime),
        });
      }

      const result: Record<string, string[]> = {};
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        const dayKey = startOfDay(day).toISOString();
        const busy = busyByDay[dayKey] ?? [];
        const slots = getAvailableSlots(day, busy);
        result[dayKey] = slots.map((s) => s.toISOString());
      }

      return Response.json({ week: weekParam, days: result });
    }

    if (dateParam) {
      const date = new Date(dateParam);
      if (isNaN(date.getTime())) {
        return Response.json({ error: "Invalid date" }, { status: 400 });
      }
      const busy = await getBusySlots(date);
      const slots = getAvailableSlots(date, busy);
      return Response.json({ date: dateParam, slots: slots.map((s) => s.toISOString()) });
    }

    return Response.json({ error: "Provide ?week= or ?date=" }, { status: 400 });
  } catch (err) {
    console.error("Availability error:", err);
    return Response.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}
