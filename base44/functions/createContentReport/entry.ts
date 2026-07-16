import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { reported_user_email, content_type, content_id, content_snapshot, reason, details } = body;

    if (!reported_user_email || !content_type || !content_id || !reason) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine routing: if reported user is in a school with content isolation, route to school
    let routedTo = 'lexio';
    let schoolId = '';
    let schoolName = '';

    try {
      const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
        user_email: reported_user_email,
        kicked: false,
      });

      for (const m of memberships) {
        const schools = await base44.asServiceRole.entities.School.filter({ id: m.school_id });
        if (schools[0]?.content_isolation) {
          routedTo = 'school';
          schoolId = m.school_id;
          schoolName = m.school_name || schools[0].name;
          break;
        }
      }
    } catch (e) {
      // If lookup fails, default to lexio routing
    }

    // Create the report with routing
    const report = await base44.asServiceRole.entities.ReportedContent.create({
      reporter_email: user.email,
      reported_user_email,
      content_type,
      content_id,
      content_snapshot: content_snapshot || '',
      reason,
      details: (details || '').trim(),
      status: 'pending',
      routed_to: routedTo,
      school_id: schoolId,
      school_name: schoolName,
    });

    return Response.json({
      success: true,
      report_id: report.id,
      routed_to: routedTo,
      school_name: schoolName,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});