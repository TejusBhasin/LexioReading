import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { student_email, reason, school_id } = body;

    if (!student_email) {
      return Response.json({ error: 'student_email is required' }, { status: 400 });
    }

    // Verify caller is school admin or semi_admin
    const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
      user_email: user.email,
      kicked: false,
    });
    const adminMembership = memberships.find(m => m.role === 'admin' || m.role === 'semi_admin');
    if (!adminMembership) {
      return Response.json({ error: 'Only school admins and sub-admins can offboard students.' }, { status: 403 });
    }

    // Use the admin's own school_id as the trust boundary — ignore any school_id from the body
    const sid = adminMembership.school_id;
    if (school_id && school_id !== sid) {
      return Response.json({ error: 'You can only offboard students in your own school.' }, { status: 403 });
    }

    // Verify target is in the same school
    const studentMembers = await base44.asServiceRole.entities.SchoolMember.filter({
      user_email: student_email,
      school_id: sid,
    });
    if (studentMembers.length === 0) {
      return Response.json({ error: 'Student is not a member of your school.' }, { status: 404 });
    }
    const studentMember = studentMembers[0];

    // Don't allow offboarding other admins
    if (studentMember.role === 'admin') {
      return Response.json({ error: 'Cannot offboard school admins.' }, { status: 403 });
    }

    const now = new Date().toISOString();

    // 1. Archive the student member record (preserves data, revokes school access)
    await base44.asServiceRole.entities.SchoolMember.update(studentMember.id, {
      kicked: true,
      archived: true,
      archived_at: now,
      archived_by: user.email,
      archive_reason: reason || 'Offboarded by school admin',
    });

    // 2. Remove student from all classes in this school
    const classes = await base44.asServiceRole.entities.SchoolClass.filter({ school_id: sid });
    for (const cls of classes) {
      if (cls.student_emails && cls.student_emails.includes(student_email)) {
        const updatedEmails = cls.student_emails.filter(e => e !== student_email);
        await base44.asServiceRole.entities.SchoolClass.update(cls.id, { student_emails: updatedEmails });
      }
    }

    // 3. Notify the student they've been offboarded
    await base44.asServiceRole.entities.Notification.create({
      user_email: student_email,
      type: 'school_notification',
      title: 'School Access Removed',
      body: `You have been removed from ${studentMember.school_name || 'your school'} on Lexio. Your reading data is preserved — you can continue using Lexio independently. ${reason ? `Reason: ${reason}` : ''}`,
      school_id: sid,
    });

    return Response.json({
      success: true,
      student_email,
      archived_at: now,
      message: 'Student offboarded successfully. Data preserved, school access revoked.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});