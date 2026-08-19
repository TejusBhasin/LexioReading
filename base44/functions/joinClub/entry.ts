import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { sendPushToEmails } from '../../shared/push.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { club_id, join_code } = body;
    if (!club_id) return Response.json({ error: 'club_id is required' }, { status: 400 });

    const clubs = await base44.asServiceRole.entities.ReadingClub.filter({ id: club_id });
    if (clubs.length === 0) return Response.json({ error: 'Club not found' }, { status: 404 });

    const club = clubs[0];

    // Already a member?
    if (club.member_emails?.includes(user.email)) {
      return Response.json({ success: true, already_member: true, club });
    }

    // Enforce join code / invite-only restrictions
    const requiresCode = !club.is_visible || (club.join_code && club.join_code.length > 0);
    if (requiresCode) {
      if (!join_code || join_code !== club.join_code) {
        return Response.json({ error: 'This club requires a valid join code.' }, { status: 403 });
      }
    }

    const updated = await base44.asServiceRole.entities.ReadingClub.update(club_id, {
      member_emails: [...(club.member_emails || []), user.email],
      member_count: (club.member_count || 0) + 1,
    });

    await sendPushToEmails(
      base44,
      [user.email],
      `Welcome to ${club.name}!`,
      'You joined the club. Tap to start reading together.',
      `/club/${club_id}`
    );

    return Response.json({ success: true, club: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});