import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, school_id } = body;

    // All actions require platform admin
    if (user.role !== 'admin') {
      return Response.json({ error: 'Only platform admins can access this.' }, { status: 403 });
    }

    if (action === 'list_schools') {
      const schools = await base44.asServiceRole.entities.School.list('-created_date', 500);
      const result = [];
      for (const s of schools) {
        const members = await base44.asServiceRole.entities.SchoolMember.filter({ school_id: s.id, kicked: false });
        const visibleMembers = members.filter(m => !m.hidden);
        result.push({
          id: s.id,
          name: s.name,
          description: s.description,
          creator_email: s.creator_email,
          member_count: visibleMembers.length,
          admin_count: visibleMembers.filter(m => m.role === 'admin' || m.role === 'semi_admin').length,
          is_active: s.is_active,
          content_isolation: s.content_isolation,
          age_restriction: s.age_restriction,
          created_date: s.created_date,
          theme_primary: s.theme_primary,
        });
      }
      return Response.json({ schools: result });
    }

    if (action === 'get_school_details') {
      if (!school_id) return Response.json({ error: 'school_id required' }, { status: 400 });

      const schools = await base44.asServiceRole.entities.School.filter({ id: school_id });
      if (!schools[0]) return Response.json({ error: 'School not found' }, { status: 404 });
      const s = schools[0];

      const [allMembers, logs, incidents] = await Promise.all([
        base44.asServiceRole.entities.SchoolMember.filter({ school_id }),
        base44.asServiceRole.entities.SchoolActionLog.filter({ school_id }, '-created_date', 200),
        base44.asServiceRole.entities.ReportedContent.filter({ routed_to: 'school', school_id }, '-created_date', 100),
      ]);

      const visibleMembers = allMembers.filter(m => !m.hidden);
      const hiddenAdmins = allMembers.filter(m => m.hidden);

      return Response.json({
        school: s,
        members: visibleMembers,
        hidden_admins: hiddenAdmins,
        logs,
        incidents,
      });
    }

    if (action === 'become_admin') {
      if (!school_id) return Response.json({ error: 'school_id required' }, { status: 400 });

      const schools = await base44.asServiceRole.entities.School.filter({ id: school_id });
      if (!schools[0]) return Response.json({ error: 'School not found' }, { status: 404 });
      const schoolName = schools[0].name;

      const existing = await base44.asServiceRole.entities.SchoolMember.filter({ school_id, user_email: user.email });
      const visibleExisting = existing.find(m => !m.hidden && (m.role === 'admin' || m.role === 'semi_admin'));
      if (visibleExisting) {
        return Response.json({ error: 'You are already a visible admin of this school.' });
      }

      const hiddenExisting = existing.find(m => m.hidden);
      if (hiddenExisting) {
        return Response.json({ success: true, message: 'Already a hidden admin.' });
      }

      if (existing[0]) {
        await base44.asServiceRole.entities.SchoolMember.update(existing[0].id, {
          role: 'admin',
          hidden: true,
          kicked: false,
        });
      } else {
        await base44.asServiceRole.entities.SchoolMember.create({
          school_id,
          school_name: schoolName,
          user_email: user.email,
          username: user.full_name || user.email,
          role: 'admin',
          hidden: true,
          joined_date: new Date().toISOString(),
          kicked: false,
        });
      }

      await base44.asServiceRole.entities.SchoolActionLog.create({
        school_id,
        school_name: schoolName,
        actor_email: user.email,
        actor_name: user.full_name || user.email,
        actor_role: 'lexio_admin',
        action_type: 'admin_became_admin',
        action_description: 'Lexio admin became hidden admin',
      });

      return Response.json({ success: true });
    }

    if (action === 'leave_admin') {
      if (!school_id) return Response.json({ error: 'school_id required' }, { status: 400 });

      const existing = await base44.asServiceRole.entities.SchoolMember.filter({ school_id, user_email: user.email, hidden: true });
      if (existing[0]) {
        await base44.asServiceRole.entities.SchoolMember.delete(existing[0].id);
      }

      return Response.json({ success: true });
    }

    if (action === 'toggle_active') {
      if (!school_id) return Response.json({ error: 'school_id required' }, { status: 400 });
      const schools = await base44.asServiceRole.entities.School.filter({ id: school_id });
      if (!schools[0]) return Response.json({ error: 'School not found' }, { status: 404 });
      const s = schools[0];
      const newState = !s.is_active;
      await base44.asServiceRole.entities.School.update(school_id, { is_active: newState });
      await base44.asServiceRole.entities.SchoolActionLog.create({
        school_id,
        school_name: s.name,
        actor_email: user.email,
        actor_name: user.full_name || user.email,
        actor_role: 'lexio_admin',
        action_type: newState ? 'school_activated' : 'school_deactivated',
        action_description: `School ${newState ? 'activated' : 'deactivated'} by Lexio admin`,
      });
      return Response.json({ success: true, is_active: newState });
    }

    if (action === 'delete_school') {
      if (!school_id) return Response.json({ error: 'school_id required' }, { status: 400 });
      const schools = await base44.asServiceRole.entities.School.filter({ id: school_id });
      if (!schools[0]) return Response.json({ error: 'School not found' }, { status: 404 });
      const s = schools[0];

      // Delete all related data
      const [members, classes, logs, incidents, assignments, submissions] = await Promise.all([
        base44.asServiceRole.entities.SchoolMember.filter({ school_id }),
        base44.asServiceRole.entities.SchoolClass.filter({ school_id }),
        base44.asServiceRole.entities.SchoolActionLog.filter({ school_id }),
        base44.asServiceRole.entities.ReportedContent.filter({ routed_to: 'school', school_id }),
        base44.asServiceRole.entities.Assignment.filter({ school_id }),
        base44.asServiceRole.entities.AssignmentSubmission.filter({}),
      ]);

      const classIds = classes.map(c => c.id);
      const assignmentIds = assignments.map(a => a.id);
      const relatedSubs = submissions.filter(sub => assignmentIds.includes(sub.assignment_id));

      // Delete in order
      if (relatedSubs.length) await base44.asServiceRole.entities.AssignmentSubmission.deleteMany({ assignment_id: { $in: assignmentIds } });
      if (assignments.length) await base44.asServiceRole.entities.Assignment.deleteMany({ school_id });
      if (incidents.length) await base44.asServiceRole.entities.ReportedContent.deleteMany({ routed_to: 'school', school_id });
      if (logs.length) await base44.asServiceRole.entities.SchoolActionLog.deleteMany({ school_id });
      if (classes.length) await base44.asServiceRole.entities.SchoolClass.deleteMany({ school_id });
      if (members.length) await base44.asServiceRole.entities.SchoolMember.deleteMany({ school_id });
      await base44.asServiceRole.entities.School.delete(school_id);

      return Response.json({ success: true, deleted: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});