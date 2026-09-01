import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendPushToEmails } from '../../shared/push.ts';

// Triggered by the "Notification create" entity automation.
// Sends a native push for every new in-app notification (bell),
// which also covers admin Direct Notify sends and vault-expiry alerts.
export default async function (req) {
  try {
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
    const ageMin = (Date.now() - new Date(record.created_date).getTime()) / 60000;
    if (ageMin > 5) return Response.json({ skipped: true });

    const result = await sendPushToEmails(
      base44,
      [record.user_email],
      record.title || 'Lexio',
      record.body || '',
      record.link
    );
    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}