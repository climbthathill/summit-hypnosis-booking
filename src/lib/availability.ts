import { addMinutes, startOfDay, addDays, addHours } from "date-fns";

// Business hours: Mon–Fri, 10:15am–5:00pm
const BUSINESS_START = { hour: 10, minute: 15 };
const BUSINESS_END = { hour: 17, minute: 0 };
const SESSION_DURATION_MINUTES = 60;
const MIN_ADVANCE_HOURS = 20;

// Days 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
const WORKING_DAYS = [1, 2, 3, 4, 5];

export function getAvailableSlots(
  date: Date,
  busySlots: { start: Date; end: Date }[]
): Date[] {
  const dayOfWeek = date.getDay();
  if (!WORKING_DAYS.includes(dayOfWeek)) return [];

  const slots: Date[] = [];
  const base = startOfDay(date);
  const minBookableTime = addHours(new Date(), MIN_ADVANCE_HOURS);

  let current = new Date(base);
  current.setHours(BUSINESS_START.hour, BUSINESS_START.minute, 0, 0);

  const endLimit = new Date(base);
  endLimit.setHours(BUSINESS_END.hour, BUSINESS_END.minute, 0, 0);

  while (current < endLimit) {
    const slotEnd = addMinutes(current, SESSION_DURATION_MINUTES);
    if (slotEnd > endLimit) break;

    const slotStart = new Date(current);

    // Enforce 20-hour minimum advance booking
    if (slotStart >= minBookableTime) {
      const overlaps = busySlots.some(
        (busy) => slotStart < busy.end && slotEnd > busy.start
      );
      if (!overlaps) {
        slots.push(slotStart);
      }
    }

    current = addMinutes(current, SESSION_DURATION_MINUTES);
  }

  return slots;
}

export function getBookableDates(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: Date[] = [];

  for (let i = 0; i <= 14; i++) {
    const d = addDays(today, i);
    if (WORKING_DAYS.includes(d.getDay())) {
      dates.push(d);
    }
  }

  return dates;
}

export function isValidSlot(startTime: Date): boolean {
  const day = startTime.getDay();
  if (!WORKING_DAYS.includes(day)) return false;

  // Must be at least 20 hours in the future
  if (startTime < addHours(new Date(), MIN_ADVANCE_HOURS)) return false;

  const base = startOfDay(startTime);
  const earliest = new Date(base);
  earliest.setHours(BUSINESS_START.hour, BUSINESS_START.minute, 0, 0);
  const latest = new Date(base);
  latest.setHours(BUSINESS_END.hour - 1, BUSINESS_END.minute, 0, 0);

  return startTime >= earliest && startTime <= latest;
}
