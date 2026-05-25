import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DAY_MAP = { Mon: 'MO', Tue: 'TU', Wed: 'WE', Thu: 'TH', Fri: 'FR', Sat: 'SA', Sun: 'SU' };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { days, time, timezone } = await req.json();

    if (!days || !days.length || !time) {
      return Response.json({ error: 'No days or time provided' }, { status: 400 });
    }

    const byDay = days.map(d => DAY_MAP[d]).filter(Boolean).join(',');
    if (!byDay) return Response.json({ error: 'Invalid days' }, { status: 400 });

    const tz = timezone || 'America/New_York';

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6a13c5e513abe52d74016dcd');

    // Delete existing Lexio reading reminder events to avoid duplicates
    const searchRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=Reading+Time+Lexio&maxResults=50&singleEvents=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();
    if (searchData.items?.length) {
      await Promise.all(
        searchData.items
          .filter(e => e.summary && e.summary.includes('Reading Time'))
          .map(e =>
            fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${e.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${accessToken}` },
            })
          )
      );
    }

    // Build start/end datetime for today as the anchor date
    const today = new Date().toISOString().slice(0, 10);
    const [hour, minute] = time.split(':').map(Number);
    const endHour = hour + 1 > 23 ? 23 : hour + 1;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    const event = {
      summary: 'Reading Time — Lexio',
      description: 'Your scheduled reading session, powered by Lexio. Keep the streak alive!',
      start: { dateTime: `${today}T${time}:00`, timeZone: tz },
      end: { dateTime: `${today}T${endTime}:00`, timeZone: tz },
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    const createRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    const created = await createRes.json();
    if (created.error) {
      return Response.json({ error: created.error.message }, { status: 400 });
    }

    return Response.json({ success: true, eventId: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});