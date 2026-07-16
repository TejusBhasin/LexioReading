import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, student_email, student_name, ban_duration_days, reason, incident_id } = body;

    // Verify caller is school admin or semi_admin
    const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
      user_email: user.email,
      kicked: false
    });
    const adminMembership = memberships.find(m => m.role === 'admin' || m.role === 'semi_admin');
    if (!adminMembership) {
      return Response.json({ error: 'Only school admins and sub-admins can ban students.' }, { status: 403 });
    }

    const schoolId = adminMembership.school_id;

    if (action === 'check_cooldown') {
      const cooldownInfo = await checkCooldown(base44, user.email);
      return Response.json(cooldownInfo);
    }

    if (action === 'ban') {
      // Validate ban duration (1-7 days)
      if (!ban_duration_days || ban_duration_days < 1 || ban_duration_days > 7) {
        return Response.json({ error: 'Ban duration must be between 1 and 7 days.' }, { status: 400 });
      }

      if (!student_email) {
        return Response.json({ error: 'Student email is required.' }, { status: 400 });
      }

      // Verify target student is in the same school
      const studentMemberships = await base44.asServiceRole.entities.SchoolMember.filter({
        user_email: student_email,
        school_id: schoolId,
        kicked: false
      });
      if (studentMemberships.length === 0) {
        return Response.json({ error: 'Student is not a member of your school.' }, { status: 403 });
      }

      // Don't allow banning other admins or semi_admins
      if (studentMemberships[0].role === 'admin' || studentMemberships[0].role === 'semi_admin') {
        return Response.json({ error: 'Cannot ban school admins or sub-admins.' }, { status: 403 });
      }

      // Check 14-day cooldown
      const cooldownInfo = await checkCooldown(base44, user.email);
      if (cooldownInfo.onCooldown) {
        return Response.json({ error: cooldownInfo.message }, { status: 403 });
      }

      // Calculate ban expiry
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ban_duration_days * 24 * 60 * 60 * 1000).toISOString();

      // Create or update UserSafeness record
      const existing = await base44.asServiceRole.entities.UserSafeness.filter({ user_email: student_email });
      const banReason = reason?.trim() || `Banned by school admin for ${ban_duration_days} day(s)`;

      if (existing[0]) {
        await base44.asServiceRole.entities.UserSafeness.update(existing[0].id, {
          is_banned: true,
          ban_expires: expiresAt,
          ban_reason: banReason,
          banned_by_email: user.email,
          banned_by_name: user.full_name || user.email,
          ban_source: 'school_admin',
          ban_issued_at: now.toISOString(),
        });
      } else {
        await base44.asServiceRole.entities.UserSafeness.create({
          user_email: student_email,
          username: student_name || student_email.split('@')[0],
          is_banned: true,
          ban_expires: expiresAt,
          ban_reason: banReason,
          banned_by_email: user.email,
          banned_by_name: user.full_name || user.email,
          ban_source: 'school_admin',
          ban_issued_at: now.toISOString(),
        });
      }

      // If linked to an incident, mark it as actioned
      if (incident_id) {
        try {
          await base44.asServiceRole.entities.ReportedContent.update(incident_id, {
            status: 'actioned',
            action_taken: 'banned',
            school_suggested_action: `Banned by ${user.full_name || user.email} for ${ban_duration_days} day(s): ${banReason}`,
            school_suggested_by: user.email,
            school_suggested_at: now.toISOString(),
          });
        } catch (e) {}
      }

      return Response.json({
        success: true,
        expires_at: expiresAt,
        student_email,
        ban_duration_days,
      });
    }

    return Response.json({ error: 'Unknown action. Use "ban" or "check_cooldown".' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function checkCooldown(base44, adminEmail) {
  const recentBans = await base44.asServiceRole.entities.UserSafeness.filter({
    banned_by_email: adminEmail,
    ban_source: 'school_admin'
  });

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentBan = recentBans.find(b =>
    b.ban_issued_at && new Date(b.ban_issued_at) > fourteenDaysAgo
  );

  if (recentBan) {
    const issuedAt = new Date(recentBan.ban_issued_at);
    const availableAt = new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    const msRemaining = availableAt - now;
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
    const hoursRemaining = Math.ceil(msRemaining / (60 * 60 * 1000));
    const timeRemaining = daysRemaining > 1 ? `${daysRemaining} days` : `${hoursRemaining} hours`;

    return {
      onCooldown: true,
      message: `You can issue another ban in ${timeRemaining} (cooldown expires ${availableAt.toLocaleDateString()}).`,
      available_at: availableAt.toISOString(),
      last_ban_date: recentBan.ban_issued_at,
    };
  }

  return {
    onCooldown: false,
    message: 'You can issue a ban.',
    available_at: null,
    last_ban_date: recentBans[0]?.ban_issued_at || null,
  };
}