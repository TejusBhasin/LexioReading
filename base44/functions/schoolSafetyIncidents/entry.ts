import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, school_id, report_id, suggestion } = body;

    if (!school_id) return Response.json({ error: 'school_id required' }, { status: 400 });

    // Verify user is admin or semi_admin of the school
    const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
      user_email: user.email,
      school_id,
      kicked: false
    });
    const membership = memberships.find(m => m.role === 'admin' || m.role === 'semi_admin');
    if (!membership) {
      return Response.json({ error: 'Not authorized. Only school admins and sub-admins can view safety incidents.' }, { status: 403 });
    }

    // Get all school members' emails (non-admin students)
    const members = await base44.asServiceRole.entities.SchoolMember.filter({
      school_id,
      kicked: false
    });
    const memberEmails = members.filter(m => m.role !== 'admin').map(m => m.user_email);
    const memberUsernames = {};
    members.forEach(m => { memberUsernames[m.user_email] = m.username || m.user_email; });

    if (action === 'list') {
      const allReports = await base44.asServiceRole.entities.ReportedContent.list('-created_date', 200);
      // Only show reports routed to this school (content isolation enabled)
      const schoolReports = allReports.filter(r =>
        r.routed_to === 'school' &&
        r.school_id === school_id &&
        memberEmails.includes(r.reported_user_email)
      );

      return Response.json({
        incidents: schoolReports.map(r => ({
          id: r.id,
          reporter_email: r.reporter_email,
          reported_user_email: r.reported_user_email,
          reported_username: memberUsernames[r.reported_user_email] || r.reported_user_email,
          content_type: r.content_type,
          content_snapshot: r.content_snapshot,
          reason: r.reason,
          details: r.details,
          status: r.status,
          ai_verdict: r.ai_verdict,
          ai_reason: r.ai_reason,
          action_taken: r.action_taken,
          school_suggested_action: r.school_suggested_action,
          school_suggested_by: r.school_suggested_by,
          school_suggested_at: r.school_suggested_at,
          created_date: r.created_date,
        })),
      });
    }

    if (action === 'suggest') {
      if (!suggestion || !suggestion.trim()) {
        return Response.json({ error: 'Suggestion text is required' }, { status: 400 });
      }

      const reports = await base44.asServiceRole.entities.ReportedContent.filter({ id: report_id });
      if (!reports[0]) return Response.json({ error: 'Report not found' }, { status: 404 });

      if (!memberEmails.includes(reports[0].reported_user_email)) {
        return Response.json({ error: 'This report is not about a student in your school' }, { status: 403 });
      }

      const updated = await base44.asServiceRole.entities.ReportedContent.update(report_id, {
        school_suggested_action: suggestion.trim(),
        school_suggested_by: user.email,
        school_suggested_at: new Date().toISOString(),
      });

      return Response.json({
        report: {
          id: updated.id,
          school_suggested_action: updated.school_suggested_action,
          school_suggested_by: updated.school_suggested_by,
          school_suggested_at: updated.school_suggested_at,
        }
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});