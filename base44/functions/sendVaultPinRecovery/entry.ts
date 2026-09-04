import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Emails the authenticated user their own Vault PIN. Takes no parameters —
// the recipient is always the caller's registered email, and the PIN is
// resolved from the database, so this can never be used as an open relay.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const records = await base44.asServiceRole.entities.VaultPin.filter({ user_email: user.email });
    const stored = records[0]?.pin;
    if (!stored) return Response.json({ sent: false });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: 'Lexio Vault PIN Recovery',
      body: `Your Lexio Vault PIN is: ${stored}\n\nIf you did not request this, please update your PIN immediately.`,
    });
    return Response.json({ sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}