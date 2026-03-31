"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { format, parseISO } from "date-fns";
import Link from "next/link";

function ConfirmationContent() {
  const params = useSearchParams();
  const firstName = params.get("firstName") ?? "there";
  const sessionType = params.get("sessionType") ?? "";
  const startTime = params.get("startTime") ?? "";
  const meetLink = params.get("meetLink") ?? "";

  const sessionLabel =
    sessionType === "online" ? "Online via Google Meet" : "In-Person (Gold Coast)";

  let formattedTime = startTime;
  try {
    formattedTime = format(parseISO(startTime), "EEEE, MMMM d yyyy 'at' h:mm a");
  } catch {
    // leave raw
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Checkmark */}
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">You&apos;re booked!</h1>
        <p className="text-slate-500 mb-6">
          Hi {firstName}, your hypnosis session is confirmed.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3 mb-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Date & Time</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{formattedTime}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Duration</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5">1 hour</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Session Type</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{sessionLabel}</p>
          </div>
          {meetLink && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Meeting Link</p>
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-600 hover:underline break-all mt-0.5 block"
              >
                {meetLink}
              </a>
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm text-slate-500">
          <p>A confirmation email with your calendar invite has been sent to you.</p>
          <p>You will receive reminders 1 day and 1 hour before your session.</p>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-sm text-slate-500 mb-1">Need to reschedule?</p>
          <a
            href="mailto:ole@summithypnosis.net"
            className="text-sm text-teal-600 hover:underline"
          >
            ole@summithypnosis.net
          </a>
        </div>

        <Link
          href="/book"
          className="mt-6 block w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
        >
          Book Another Session
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  );
}
