import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, class_id, school_id, member_id } = body;

    // ─── enroll: student self-enrolls in a class (setup tour) ───
    if (action === 'enroll') {
      if (!class_id) return Response.json({ error: 'class_id required' }, { status: 400 });

      const classes = await base44.asServiceRole.entities.SchoolClass.filter({ id: class_id });
      if (!classes[0]) return Response.json({ error: 'Class not found' }, { status: 404 });
      const cls = classes[0];

      // Verify the student is a member of the school
      const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
        user_email: user.email,
        school_id: cls.school_id,
        kicked: false,
      });
      if (!memberships[0]) {
        return Response.json({ error: 'You are not a member of this school' }, { status: 403 });
      }

      const studentEmails = cls.student_emails || [];
      if (studentEmails.includes(user.email)) {
        return Response.json({ already_enrolled: true });
      }

      await base44.asServiceRole.entities.SchoolClass.update(class_id, {
        student_emails: [...studentEmails, user.email],
      });

      return Response.json({ success: true });
    }

    // ─── approve_class_change: admin approves a student's class change ───
    if (action === 'approve_class_change') {
      if (!school_id || !member_id) return Response.json({ error: 'school_id and member_id required' }, { status: 400 });

      const adminMemberships = await base44.asServiceRole.entities.SchoolMember.filter({
        user_email: user.email,
        school_id,
        kicked: false,
      });
      const adminMembership = adminMemberships.find(m => m.role === 'admin');
      if (!adminMembership) {
        return Response.json({ error: 'Only school admins can approve class changes' }, { status: 403 });
      }

      const members = await base44.asServiceRole.entities.SchoolMember.filter({ id: member_id, school_id });
      if (!members[0]) return Response.json({ error: 'Member not found' }, { status: 404 });
      const member = members[0];

      if (!member.pending_class_id) {
        return Response.json({ error: 'No pending class change' }, { status: 400 });
      }

      // Remove from all current classes
      const allClasses = await base44.asServiceRole.entities.SchoolClass.filter({ school_id });
      const currentClasses = allClasses.filter(c => c.student_emails?.includes(member.user_email));
      for (const c of currentClasses) {
        await base44.asServiceRole.entities.SchoolClass.update(c.id, {
          student_emails: (c.student_emails || []).filter(e => e !== member.user_email),
        });
      }

      // Add to new class
      const newClass = allClasses.find(c => c.id === member.pending_class_id);
      if (newClass) {
        await base44.asServiceRole.entities.SchoolClass.update(newClass.id, {
          student_emails: [...(newClass.student_emails || []), member.user_email],
        });
      }

      // Clear pending
      await base44.asServiceRole.entities.SchoolMember.update(member_id, {
        pending_class_id: '',
        pending_class_name: '',
      });

      return Response.json({ success: true });
    }

    // ─── reject_class_change: admin rejects ───
    if (action === 'reject_class_change') {
      if (!school_id || !member_id) return Response.json({ error: 'school_id and member_id required' }, { status: 400 });

      const adminMemberships = await base44.asServiceRole.entities.SchoolMember.filter({
        user_email: user.email,
        school_id,
        kicked: false,
      });
      const adminMembership = adminMemberships.find(m => m.role === 'admin');
      if (!adminMembership) {
        return Response.json({ error: 'Only school admins can reject class changes' }, { status: 403 });
      }

      await base44.asServiceRole.entities.SchoolMember.update(member_id, {
        pending_class_id: '',
        pending_class_name: '',
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});