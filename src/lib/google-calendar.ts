import { google } from "googleapis";

function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return client;
}

export function getAuthUrl() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function getCalendarEvents(timeMin: Date, timeMax: Date) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items ?? [];
}

export async function createCalendarEvent({
  firstName,
  lastName,
  email,
  phone,
  sessionType,
  startTime,
  endTime,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sessionType: string;
  startTime: Date;
  endTime: Date;
}) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const sessionLabel = sessionType === "online" ? "Online" : "In-Person (Gold Coast)";

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    conferenceDataVersion: sessionType === "online" ? 1 : 0,
    requestBody: {
      summary: `Hypnosis Session – ${firstName} ${lastName}`,
      description: `Client: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\nSession Type: ${sessionLabel}`,
      colorId: "3", // Grape (purple)
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      attendees: [{ email }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 * 24 },
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 30 },
        ],
      },
      conferenceData:
        sessionType === "online"
          ? {
              createRequest: {
                requestId: `summit-${Date.now()}`,
                conferenceSolutionKey: { type: "hangoutsMeet" },
              },
            }
          : undefined,
    },
  });

  const meetLink =
    event.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")
      ?.uri ?? null;

  return { eventId: event.data.id ?? null, meetLink };
}

export async function deleteCalendarEvent(eventId: string) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId,
  });
}

// Returns busy time ranges for a given day from Google Calendar
export async function getBusySlots(date: Date): Promise<{ start: Date; end: Date }[]> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const events = await getCalendarEvents(dayStart, dayEnd);

  return events
    .filter((e) => e.start?.dateTime && e.end?.dateTime)
    .map((e) => ({
      start: new Date(e.start!.dateTime!),
      end: new Date(e.end!.dateTime!),
    }));
}
