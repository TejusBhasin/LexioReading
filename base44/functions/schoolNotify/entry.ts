import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { school_id, target_email, title, message, link } = body;

    if (!title || !message) {
      return Response.json({ error: 'title and message are required' }, { status: 400 });
    }

    // Verify caller is school admin or semi_admin
    const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
      user_email: user.email,
      kicked: false,
    });
    const adminMembership = memberships.find(m => m.role === 'admin' || m.role === 'semi_admin');
    if (!adminMembership) {
      return Response.json({ error: 'Only school admins and sub-admins can send notifications.' }, { status: 403 });
    }

    const sid = school_id || adminMembership.school_id;

    let recipients = [];

    if (target_email) {
      // Send to specific student — verify they're in this school
      const studentMembers = await base44.asServiceRole.entities.SchoolMember.filter({
        user_email: target_email,
        school_id: sid,
        kicked: false,
      });
      if (studentMembers.length === 0) {
        return Response.json({ error: 'Student is not a member of your school.' }, { status: 404 });
      }
      recipients = [target_email];
    } else {
      // Send to all active members
      const allMembers = await base44.asServiceRole.entities.SchoolMember.filter({
        school_id: sid,
        kicked: false,
      });
      recipients = allMembers.map(m => m.user_email);
    }

    if (recipients.length === 0) {
      return Response.json({ error: 'No recipients found.' }, { status: 400 });
    }

    // Create notifications for all recipients
    const notifications = recipients.map(email => ({
      user_email: email,
      type: 'school_notification',
      title: title.trim(),
      body: message.trim(),
      link: link || '',
      school_id: sid,
    }));

    await base44.asServiceRole.entities.Notification.bulkCreate(notifications);

    return Response.json({
      success: true,
      recipients_count: recipients.length,
      message: `Notification sent to ${recipients.length} ${recipients.length === 1 ? 'person' : 'people'}.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});