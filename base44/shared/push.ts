// Shared push notification helper used by backend functions.
// Resolves user emails -> user ids and sends a native push to each.
export async function sendPushToEmails(base44, emails, title, content, actionUrl, actionLabel) {
  const list = (emails || [])
    .map((e) => (e || '').toString().trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return { sent: 0, total: 0 };
  const unique = [...new Set(list)];

  let users = [];
  try {
    users = await base44.asServiceRole.entities.User.filter({ email: { $in: unique } });
  } catch (e) {
    return { sent: 0, total: 0, error: e.message };
  }

  let sent = 0;
  for (const u of users) {
    try {
      await base44.asServiceRole.integrations.Core.SendPushNotification({
        user_id: u.id,
        title,
        content,
        action_url: actionUrl || undefined,
        action_label: actionLabel || undefined,
      });
      sent++;
    } catch (e) {
      // skip individual failures (no device, bad token, etc.)
    }
  }
  return { sent, total: users.length };
}