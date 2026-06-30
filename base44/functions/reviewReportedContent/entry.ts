import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { report_id, mode } = await req.json();
    // mode: "ai" or "manual"
    
    const reports = await base44.asServiceRole.entities.ReportedContent.filter({ id: report_id });
    const report = reports[0];
    if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });
    if (report.status !== 'pending' && report.status !== 'reviewing') {
      return Response.json({ error: 'Report already actioned' }, { status: 400 });
    }

    const content = report.content_snapshot || '';
    let verdict = '';
    let aiReason = '';
    let isViolation = false;

    if (mode === 'ai') {
      // AI checks if this is a real violation or a fake report
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a content moderator for a reading app (age 13+). A user reported this content with reason: "${report.reason}".

Content: "${content.slice(0, 1500)}"

Reporter's note: "${(report.details || '').slice(0, 500)}"

Determine if this content is ACTUALLY objectionable. Consider:
- Is the report legitimate, or is it a false/fake report (e.g. someone reporting benign content just to harass)?
- Does the content genuinely violate community guidelines (hate speech, harassment, explicit content, threats, predatory behavior, spam)?

Respond with valid JSON only: {"is_violation": true/false, "reason": "one sentence explaining your verdict"}`,
        response_json_schema: {
          type: "object",
          properties: {
            is_violation: { type: "boolean" },
            reason: { type: "string" }
          },
          required: ["is_violation", "reason"]
        }
      });

      isViolation = result?.is_violation === true;
      aiReason = result?.reason || '';
      verdict = isViolation ? 'upheld' : 'dismissed';
    } else {
      // Manual mode — admin manually reviews; default to upheld if admin says so
      isViolation = true;
      verdict = 'upheld';
      aiReason = 'Manually reviewed by admin';
    }

    let actionTaken = 'none';

    if (isViolation) {
      // Warning system: warn once, warn twice, ban forever on 3rd
      const safetyRecs = await base44.asServiceRole.entities.UserSafeness.filter({ user_email: report.reported_user_email });
      let safety = safetyRecs[0];
      if (!safety) {
        safety = await base44.asServiceRole.entities.UserSafeness.create({
          user_email: report.reported_user_email,
          warning_count: 0,
          warning_reasons: [],
        });
      }

      const newWarningCount = (safety.warning_count || 0) + 1;
      const now = new Date().toISOString();
      const warningReasons = (safety.warning_reasons || []).concat([aiReason]);

      if (newWarningCount >= 3) {
        // Ban forever
        await base44.asServiceRole.entities.UserSafeness.update(safety.id, {
          is_banned: true,
          ban_reason: `Permanently banned after 3 content violations. Last violation: ${aiReason}`,
          warning_count: newWarningCount,
          warning_reasons: warningReasons,
          last_warning_date: now,
        });
        actionTaken = 'banned';

        // Notify the user
        await base44.asServiceRole.entities.Notification.create({
          user_email: report.reported_user_email,
          type: 'general',
          title: 'Account Banned',
          body: `Your account has been permanently banned due to repeated content violations. Reason: ${aiReason}`,
          is_read: false,
        });
      } else {
        // Warn (1st or 2nd)
        await base44.asServiceRole.entities.UserSafeness.update(safety.id, {
          warning_count: newWarningCount,
          warning_reasons: warningReasons,
          last_warning_date: now,
        });
        actionTaken = 'warned';

        // Notify the user
        await base44.asServiceRole.entities.Notification.create({
          user_email: report.reported_user_email,
          type: 'general',
          title: `Warning ${newWarningCount} of 2`,
          body: `Your content was flagged and reviewed. Reason: ${aiReason}. One more violation will result in a permanent ban.`,
          is_read: false,
        });
      }

      // Remove the offending content
      const entityMap = {
        forum_post: 'ForumPost',
        forum_comment: 'ForumComment',
        review: 'Review',
        club_post: 'ClubPost',
        discussion: 'Discussion',
        chat_message: 'ChatMessage',
      };
      const entityName = entityMap[report.content_type];
      if (entityName) {
        try {
          await base44.asServiceRole.entities[entityName].delete(report.content_id);
        } catch (e) {
          // Content may already be deleted
        }
      }
      if (actionTaken === 'banned') actionTaken = 'banned';
    } else {
      actionTaken = 'none';
    }

    // Mark report as actioned
    await base44.asServiceRole.entities.ReportedContent.update(report.id, {
      status: 'actioned',
      ai_verdict: verdict,
      ai_reason: aiReason,
      action_taken: actionTaken,
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      verdict,
      action_taken: actionTaken,
      warning_count: isViolation ? undefined : undefined,
      reason: aiReason,
    });
  } catch (error) {
    console.error('[ReviewReportedContent] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});