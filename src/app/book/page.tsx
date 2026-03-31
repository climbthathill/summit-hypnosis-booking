"use client";

import { useEffect, useState, useCallback } from "react";
import {
  format,
  parseISO,
  startOfDay,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addHours,
} from "date-fns";
import { useRouter } from "next/navigation";

// Minimum advance booking: 20 hours from now
const MIN_ADVANCE_HOURS = 20;

type WeekSlots = Record<string, string[]>; // ISO day key → slot ISO strings

export default function BookPage() {
  const router = useRouter();

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => startOfDay(new Date()));
  const [weekSlots, setWeekSlots] = useState<WeekSlots>({});
  const [weekLoading, setWeekLoading] = useState(false);

  // Booking state
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<"calendar" | "details" | "submitting">("calendar");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", sessionType: "" });
  const [error, setError] = useState<string | null>(null);

  const fetchWeek = useCallback(async (start: Date) => {
    setWeekLoading(true);
    try {
      const res = await fetch(`/api/availability?week=${encodeURIComponent(start.toISOString())}`);
      const data = await res.json();
      setWeekSlots(data.days ?? {});
    } finally {
      setWeekLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeek(weekStart);
  }, [weekStart, fetchWeek]);

  function goToPrevWeek() {
    const prev = subDays(weekStart, 7);
    setWeekStart(prev);
    setCalendarMonth(prev);
  }

  function goToNextWeek() {
    const next = addDays(weekStart, 7);
    setWeekStart(next);
    setCalendarMonth(next);
  }

  function handleCalendarDayClick(day: Date) {
    const weekBegin = startOfDay(day);
    setWeekStart(weekBegin);
    setCalendarMonth(day);
  }

  function handleSlotClick(slot: string) {
    setSelectedSlot(slot);
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.sessionType) { setError("Please select a session type."); return; }
    setStep("submitting");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, startTime: selectedSlot }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setStep("details"); return; }
      router.push(`/book/confirmation?` + new URLSearchParams({
        firstName: form.firstName,
        sessionType: data.sessionType,
        startTime: data.startTime,
        meetLink: data.meetLink ?? "",
      }).toString());
    } catch {
      setError("Network error. Please try again.");
      setStep("details");
    }
  }

  // Build mini calendar days
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const calDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // Pad start to Monday
  const startPad = (monthStart.getDay() + 6) % 7;
  const paddedDays: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...calDays,
  ];

  // Week days to display (7 days from weekStart)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const minBookable = addHours(new Date(), MIN_ADVANCE_HOURS);

  if (step === "details" || step === "submitting") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 px-6 py-5">
            <button onClick={() => setStep("calendar")} className="text-teal-400 text-sm hover:underline mb-3 flex items-center gap-1">
              ← Back to calendar
            </button>
            <p className="text-xs text-teal-400 font-semibold tracking-widest uppercase">Summit Hypnosis Session</p>
            <p className="text-white font-semibold mt-1">
              {selectedSlot ? format(parseISO(selectedSlot), "EEEE, MMMM d 'at' h:mm a") : ""}
            </p>
            <p className="text-slate-400 text-sm">1 hour · with Ole Hill</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">First name *</label>
                <input required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Surname *</label>
                <input required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email address *</label>
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Phone number *</label>
              <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Session type *</label>
              <div className="grid grid-cols-2 gap-2">
                {["online", "in-person"].map(type => (
                  <label key={type} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-sm transition-colors ${
                    form.sessionType === type
                      ? "border-teal-500 bg-teal-50 text-teal-800 font-medium"
                      : "border-slate-200 text-slate-700 hover:border-teal-300"
                  }`}>
                    <input type="radio" name="sessionType" value={type} checked={form.sessionType === type}
                      onChange={e => setForm({ ...form, sessionType: e.target.value })} className="sr-only" />
                    {type === "online" ? "Online" : "In-Person (Gold Coast)"}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" disabled={step === "submitting"}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm mt-2">
              {step === "submitting" ? "Confirming…" : "Confirm Booking"}
            </button>
            <p className="text-xs text-center text-slate-400">
              You will receive a confirmation email with calendar invite and reminders.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-10">
      <div className="max-w-5xl mx-auto">

        {/* Page header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">O</div>
          <div>
            <p className="text-teal-400 text-xs font-semibold tracking-widest uppercase">Ole Hill</p>
            <h1 className="text-2xl font-bold text-white">Summit Hypnosis Session</h1>
            <p className="text-slate-400 text-sm">60 min · Google Meet video conference info added after booking</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden">

          {/* Left: mini month calendar */}
          <div className="md:w-64 border-b md:border-b-0 md:border-r border-slate-100 p-5 flex-shrink-0">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                className="p-1 rounded hover:bg-slate-100 text-slate-500">
                ‹
              </button>
              <span className="text-sm font-semibold text-slate-700">
                {format(calendarMonth, "MMMM yyyy")}
              </span>
              <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                className="p-1 rounded hover:bg-slate-100 text-slate-500">
                ›
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <div key={i} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {paddedDays.map((day, i) => {
                if (!day) return <div key={i} />;
                const isSelected = weekDays.some(wd => isSameDay(wd, day));
                const tooSoon = day < startOfDay(addHours(new Date(), MIN_ADVANCE_HOURS));
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const disabled = tooSoon || isWeekend || !isSameMonth(day, calendarMonth);
                return (
                  <button key={i} onClick={() => !disabled && handleCalendarDayClick(day)}
                    disabled={disabled}
                    className={`w-7 h-7 mx-auto rounded-full text-xs flex items-center justify-center transition-colors
                      ${disabled ? "text-slate-300 cursor-default" : ""}
                      ${!disabled && isToday(day) ? "border border-teal-400 text-teal-600 font-semibold" : ""}
                      ${!disabled && isSelected ? "bg-teal-600 text-white font-semibold" : ""}
                      ${!disabled && !isSelected ? "hover:bg-slate-100 text-slate-600" : ""}
                    `}>
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
              <p>Available Mon–Fri</p>
              <p>10:15 am – 5:00 pm AEST</p>
              <p className="mt-1">Bookings require 20 hrs notice</p>
            </div>
          </div>

          {/* Right: week view */}
          <div className="flex-1 p-5 min-w-0">
            {/* Week nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={goToPrevWeek}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
                ‹
              </button>
              <span className="text-sm font-semibold text-slate-600">
                {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
              </span>
              <button onClick={goToNextWeek}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
                ›
              </button>
            </div>

            {/* Day columns */}
            <div className="grid grid-cols-7 gap-1.5">
              {weekDays.map((day) => {
                const dayKey = startOfDay(day).toISOString();
                const slots = weekSlots[dayKey] ?? [];
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <div key={dayKey} className="flex flex-col items-center gap-1.5">
                    {/* Day header */}
                    <div className="text-center mb-1">
                      <p className="text-xs text-slate-400 uppercase font-medium">
                        {format(day, "EEE")}
                      </p>
                      <p className={`text-sm font-semibold ${isToday(day) ? "text-teal-600" : "text-slate-700"}`}>
                        {format(day, "d")}
                      </p>
                    </div>

                    {/* Slots */}
                    {weekLoading ? (
                      <div className="w-full h-8 bg-slate-100 rounded animate-pulse" />
                    ) : isWeekend ? (
                      <span className="text-slate-300 text-sm">–</span>
                    ) : slots.length === 0 ? (
                      <span className="text-slate-300 text-sm">–</span>
                    ) : (
                      slots.map(slot => (
                        <button key={slot} onClick={() => handleSlotClick(slot)}
                          className="w-full border border-teal-500 text-teal-700 hover:bg-teal-500 hover:text-white rounded-full py-1 text-xs font-medium transition-colors">
                          {format(parseISO(slot), "h:mm a")}
                        </button>
                      ))
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-5 text-right text-xs text-slate-400">
              Times shown in Australian Eastern Standard Time
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-5">
          Questions? Email{" "}
          <a href="mailto:ole@summithypnosis.net" className="text-teal-400 hover:underline">
            ole@summithypnosis.net
          </a>
        </p>
      </div>
    </div>
  );
}
