import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = '6a137f90ca344552dcf8ff6d';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch (connErr) {
      console.log('Connection lookup failed:', connErr.message);
      return Response.json({ error: 'not_connected', detail: connErr.message }, { status: 404 });
    }

    // Verify the token works with Google
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const body = await response.json();
    console.log('Google API status:', response.status, JSON.stringify(body).slice(0, 200));

    if (!response.ok) {
      return Response.json({ error: 'google_api_failed', status: response.status, detail: body?.error?.message }, { status: 400 });
    }

    return Response.json({ connected: true });
  } catch (error) {
    console.log('testGcalConnection error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});