import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendPushToEmails } from '../../shared/push.ts';

// Triggered by the "Notification create" entity automation.
// Sends a native push for every new in-app notification (bell),
// which also covers admin Direct Notify sends and vault-expiry alerts.
export default async function (req) {
  try {
    // Caller guard: the only legitimate caller is the internal "Notification
    // create" automation (a server-side, headerless or same-origin request).
    // Reject anything that arrives with a browser Origin/Referer from a
    // different host — i.e. a cross-origin external caller. Headerless
    // callers (the automation, and curl) are still bound by the idempotency
    // + DB-resolution + freshness checks below, so they cannot abuse the push.
    const reqUrl = new URL(req.url);
    const host = reqUrl.host;
    const matchesHost = (h) => { try { return new URL(h).host === host; } catch (e) { return false; } };
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    if (origin && !matchesHost(origin)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (referer && !matchesHost(referer)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const notif = body?.data;
    const id = body?.event?.entity_id || notif?.id;
    if (!id) {
      return Response.json({ skipped: true });
    }
    // Resolve the real record from the DB so a direct (unauthenticated) caller
    // can't push arbitrary content/recipient — only an actual, just-created
    // Notification can trigger a push, and only with its stored fields.
    let record;
    try {
      const records = await base44.asServiceRole.entities.Notification.filter({ id });
      record = records[0];
    } catch (e) {
      return Response.json({ skipped: true });
    }
    if (!record) return Response.json({ skipped: true });
    // Idempotency: a notification only ever pushes once. An external caller
    // hitting the public URL can only reference existing notifications, so this
    // guarantees they cannot trigger duplicate pushes.
    if (record.push_sent) return Response.json({ skipped: true });
    // Only freshly-created notifications are eligible (automation fires on create).
    const ageSec = (Date.now() - new Date(record.created_date).getTime()) / 1000;
    if (ageSec > 60) return Response.json({ skipped: true });

    const result = await sendPushToEmails(
      base44,
      [record.user_email],
      record.title || 'Lexio',
      record.body || '',
      record.link
    );
    // Mark as pushed so any subsequent call (incl. by a stranger) is a no-op.
    try {
      await base44.asServiceRole.entities.Notification.update(record.id, { push_sent: true });
    } catch (e) {}
    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}