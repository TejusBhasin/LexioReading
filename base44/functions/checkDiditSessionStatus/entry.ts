import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { syncUsername } from '../../shared/syncUsername.ts';

// Polls Didit directly for the current user's session decision and mirrors it
// onto their UserProfile. This makes the blue checkmark appear reliably after
// the Didit redirect even when the webhook hasn't fired yet.
const STATUS_MAP = {
  Approved: { is_verified: true, verification_status: 'approved', verified_at: new Date().toISOString() },
  Declined: { is_verified: false, verification_status: 'declined' },
  'In Review': { verification_status: 'in_review' },
  'In Progress': { verification_status: 'in_progress' },
  'Awaiting User': { verification_status: 'awaiting_user' },
  Resubmitted: { verification_status: 'resubmitted' },
  Abandoned: { verification_status: 'abandoned' },
  Expired: { is_verified: false, verification_status: 'expired' },
  'Kyc Expired': { is_verified: false, verification_status: 'expired' },
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email.toLowerCase() });
    const profile = profiles[0];
    if (!profile || !profile.didit_session_id) {
      return Response.json({ status: profile?.verification_status || 'not_started', verified: !!profile?.is_verified });
    }

    // Already approved — nothing to do.
    if (profile.is_verified) {
      return Response.json({ status: 'approved', verified: true });
    }

    const apiKey = secrets.get('DIDIT_API_KEY');
    if (!apiKey) return Response.json({ error: 'not configured' }, { status: 500 });

    const res = await fetch(`https://verification.didit.me/v3/session/${profile.didit_session_id}/`, {
      headers: { 'x-api-key': apiKey },
    });

    if (!res.ok) {
      return Response.json({ status: profile.verification_status, verified: false });
    }

    const session = await res.json();
    const decision = STATUS_MAP[session.status] ? { ...STATUS_MAP[session.status] } : null;
    if (decision && session.status === 'Approved') {
      decision.username = (profile.verified_real_name || profile.username || '').replace(/ /g, '_').toLowerCase();
    }
    if (decision) {
      await base44.asServiceRole.entities.UserProfile.update(profile.id, decision);
      if (decision.username) {
        await syncUsername(base44, user.email.toLowerCase(), decision.username);
      }
    }

    return Response.json({
      status: decision ? decision.verification_status || (session.status === 'Approved' ? 'approved' : profile.verification_status) : profile.verification_status,
      verified: decision ? !!decision.is_verified : false,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}