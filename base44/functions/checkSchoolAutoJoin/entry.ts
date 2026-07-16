import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userDomain = user.email.split('@')[1]?.toLowerCase();
    if (!userDomain) return Response.json({ joined: false });

    // Find schools with approved email domains matching the user's domain
    const schools = await base44.asServiceRole.entities.School.filter({
      email_domain_status: 'approved',
      is_active: true,
    });

    const matchingSchool = schools.find(s =>
      s.email_domain && s.email_domain.toLowerCase() === userDomain
    );

    if (!matchingSchool) return Response.json({ joined: false });

    // Check if already a member
    const existing = await base44.asServiceRole.entities.SchoolMember.filter({
      user_email: user.email,
      school_id: matchingSchool.id,
    });

    if (existing.some(m => !m.kicked)) {
      return Response.json({ joined: false, alreadyMember: true });
    }

    // Check if previously kicked — don't re-add kicked members
    if (existing.some(m => m.kicked)) {
      return Response.json({ joined: false });
    }

    // Create membership
    await base44.asServiceRole.entities.SchoolMember.create({
      school_id: matchingSchool.id,
      school_name: matchingSchool.name,
      user_email: user.email,
      username: user.full_name || user.email,
      role: 'member',
      joined_date: new Date().toISOString(),
      kicked: false,
    });

    // Increment member count
    await base44.asServiceRole.entities.School.update(matchingSchool.id, {
      member_count: (matchingSchool.member_count || 1) + 1,
    });

    return Response.json({
      joined: true,
      school: {
        id: matchingSchool.id,
        name: matchingSchool.name,
        join_code: matchingSchool.join_code,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});