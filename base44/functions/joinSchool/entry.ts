import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendPushToEmails } from '../../shared/push.ts';

// Joins a school via join code (replaces the client-side flow so a push
// notification can fire server-side after a successful join).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { join_code } = body;
    if (!join_code) return Response.json({ error: 'join_code is required' }, { status: 400 });

    const schools = await base44.asServiceRole.entities.School.filter({
      join_code: String(join_code).toUpperCase(),
    });
    if (!schools[0]) return Response.json({ error: 'Invalid join code.' }, { status: 404 });
    const s = schools[0];

    const existing = await base44.asServiceRole.entities.SchoolMember.filter({
      school_id: s.id,
      user_email: user.email,
    });
    if (existing.some((m) => !m.kicked)) {
      return Response.json({ error: 'You are already in this school.' }, { status: 409 });
    }
    if (existing.some((m) => m.kicked)) {
      return Response.json({ error: 'You cannot rejoin this school.' }, { status: 403 });
    }

    const m = await base44.asServiceRole.entities.SchoolMember.create({
      school_id: s.id,
      school_name: s.name,
      user_email: user.email,
      username: user.full_name || user.email,
      role: 'member',
      joined_date: new Date().toISOString(),
      kicked: false,
    });
    await base44.asServiceRole.entities.School.update(s.id, {
      member_count: (s.member_count || 1) + 1,
    });

    await sendPushToEmails(
      base44,
      [user.email],
      `Welcome to ${s.name}!`,
      "You've joined your school. Tap to view your school hub.",
      '/school-admin'
    );

    return Response.json({ success: true, school: s, member: m });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}