import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Admin-only: this scans all users' vault entries
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Fetch all vault entries (service role)
    const allEntries = await base44.asServiceRole.entities.VaultEntry.filter({});
    const expiring = allEntries.filter(e => {
      if (!e.expiration_date) return false;
      const exp = new Date(e.expiration_date);
      return exp >= now && exp <= thirtyDaysFromNow;
    });

    // Fetch existing vault-expiry notifications to avoid duplicates
    const existingNotifs = await base44.asServiceRole.entities.Notification.filter({ type: 'general' });
    const existingKeys = new Set(existingNotifs.map(n => n.group_key).filter(Boolean));

    const toCreate = [];
    for (const entry of expiring) {
      const groupKey = `vault_expiry_${entry.id}`;
      if (existingKeys.has(groupKey)) continue;

      const expDate = new Date(entry.expiration_date);
      const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
      const dateStr = expDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      toCreate.push({
        user_email: entry.user_email,
        type: 'general',
        title: 'Library card expiring soon',
        body: `"${entry.card_name}" expires on ${dateStr} (${daysLeft} day${daysLeft === 1 ? '' : 's'} left). Check your Vault for details.`,
        link: '/vault',
        group_key: groupKey,
        is_read: false,
      });
    }

    let created = 0;
    if (toCreate.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(toCreate);
      created = toCreate.length;
    }

    return Response.json({ checked: allEntries.length, expiring: expiring.length, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});