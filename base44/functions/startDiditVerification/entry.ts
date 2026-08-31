import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Per-session config (NOT a secret). "Free KYC superuser" workflow.
const WORKFLOW_ID = '9a3430fc-6139-45ca-86e7-314c45c3afee';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { key, real_name } = await req.json().catch(() => ({}));
    const keyStr = String(key || '').trim();
    const nameStr = String(real_name || '').trim();
    if (!keyStr || nameStr.length < 2) {
      return Response.json({ error: 'A valid key and your real name are required' }, { status: 400 });
    }

    // Find an unused key (service role — VerificationKey is admin-only via RLS).
    const keys = await base44.asServiceRole.entities.VerificationKey.filter({ key: keyStr, is_used: false });
    if (keys.length === 0) {
      return Response.json({ error: 'Invalid or already used verification key' }, { status: 400 });
    }
    const vk = keys[0];

    const apiKey = secrets.get('DIDIT_API_KEY');
    if (!apiKey) return Response.json({ error: 'Identity verification is not configured yet.' }, { status: 500 });

    const res = await fetch('https://verification.didit.me/v3/session/', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: WORKFLOW_ID,
        vendor_data: user.email,
        callback: 'https://lexio-reading.base44.app/profile',
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return Response.json({ error: 'Failed to start identity check', detail }, { status: 502 });
    }

    const session = await res.json();

    // Mark the key consumed and stamp the profile with the pending session.
    await base44.asServiceRole.entities.VerificationKey.update(vk.id, {
      is_used: true,
      used_by_email: user.email,
      used_at: new Date().toISOString(),
    });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email });
    if (profiles[0]) {
      await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
        verification_status: 'pending',
        didit_session_id: session.session_id,
        verified_real_name: nameStr,
        is_verified: false,
      });
    } else {
      await base44.asServiceRole.entities.UserProfile.create({
        user_email: user.email,
        verification_status: 'pending',
        didit_session_id: session.session_id,
        verified_real_name: nameStr,
        is_verified: false,
      });
    }

    return Response.json({ url: session.url, session_id: session.session_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}