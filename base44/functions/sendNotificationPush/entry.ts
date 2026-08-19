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
    if (!notif || !notif.user_email) {
      return Response.json({ skipped: true });
    }
    const result = await sendPushToEmails(
      base44,
      [notif.user_email],
      notif.title || 'Lexio',
      notif.body || '',
      notif.link
    );
    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}