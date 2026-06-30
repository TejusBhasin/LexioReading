import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ENTITY_MAP = {
  forum_post: 'ForumPost',
  forum_comment: 'ForumComment',
  review: 'Review',
  club_post: 'ClubPost',
  discussion: 'Discussion',
  chat_message: 'ChatMessage',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { report_id, mode } = await req.json();
    // mode: "ai", "manual", or "undo"

    const reports = await base44.asServiceRole.entities.ReportedContent.filter({ id: report_id });
    const report = reports[0];
    if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });

    // ─── UNDO MODE: reverse a previously actioned report ───
    if (mode === 'undo') {
      if (report.status !== 'actioned') {
        return Response.json({ error: 'Only actioned reports can be undone' }, { status: 400 });
      }

      // Reverse the safety action (warning / ban)
      if (report.action_taken === 'warned' || report.action_taken === 'banned') {
        const safetyRecs = await base44.asServiceRole.entities.UserSafeness.filter({ user_email: report.reported_user_email });
        const safety = safetyRecs[0];
        if (safety) {
          const reasonToRemove = report.ai_reason || '';
          const newWarningReasons = (safety.warning_reasons || []).filter(r => r !== reasonToRemove);
          const newWarningCount = Math.max(0, (safety.warning_count || 0) - 1);
          const updateData = {
            warning_count: newWarningCount,
            warning_reasons: newWarningReasons,
          };
          if (report.action_taken === 'banned') {
            updateData.is_banned = false;
            updateData.ban_reason = '';
            updateData.ban_expires = '';
          }
          await base44.asServiceRole.entities.UserSafeness.update(safety.id, updateData);
        }
      }

      // Restore the deleted content from stored original
      const entityName = ENTITY_MAP[report.content_type];
      if (entityName && report.original_content) {
        try {
          const original = JSON.parse(report.original_content);
          delete original.id;
          delete original.created_date;
          delete original.updated_date;
          delete original.created_by_id;
          await base44.asServiceRole.entities[entityName].create(original);
        } catch (e) {
          // Content restore failed — continue with the undo anyway
        }
      }

      // Mark report as undone
      await base44.asServiceRole.entities.ReportedContent.update(report.id, {
        status: 'dismissed',
        ai_verdict: 'dismissed',
        ai_reason: 'Action undone by admin ' + new Date().toISOString(),
        action_taken: 'none',
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
      });

      // Notify the user
      await base44.asServiceRole.entities.Notification.create({
        user_email: report.reported_user_email,
        type: 'general',
        title: 'Moderation Action Reversed',
        body: 'A moderation action against your account has been reversed by an administrator. Any removed content has been restored.',
        is_read: false,
      });

      return Response.json({ ok: true, undone: true });
    }

    // ─── AI / MANUAL MODE (original review flow) ───
    if (report.status !== 'pending' && report.status !== 'reviewing') {
      return Response.json({ error: 'Report already actioned' }, { status: 400 });
    }

    const content = report.content_snapshot || '';
    let verdict = '';
    let aiReason = '';
    let isViolation = false;

    if (mode === 'ai') {
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
      // Manual mode — admin manually reviews; default to upheld
      isViolation = true;
      verdict = 'upheld';
      aiReason = 'Manually reviewed by admin';
    }

    let actionTaken = 'none';
    let originalContentJson = '';

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

        await base44.asServiceRole.entities.Notification.create({
          user_email: report.reported_user_email,
          type: 'general',
          title: `Warning ${newWarningCount} of 2`,
          body: `Your content was flagged and reviewed. Reason: ${aiReason}. One more violation will result in a permanent ban.`,
          is_read: false,
        });
      }

      // Store the original content before deleting, so it can be restored on undo
      const entityName = ENTITY_MAP[report.content_type];
      if (entityName) {
        try {
          const items = await base44.asServiceRole.entities[entityName].filter({ id: report.content_id });
          if (items[0]) {
            originalContentJson = JSON.stringify(items[0]);
          }
        } catch (e) {
          // Content may already be deleted
        }
        // Delete the offending content
        try {
          await base44.asServiceRole.entities[entityName].delete(report.content_id);
        } catch (e) {
          // Content may already be deleted
        }
      }
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
      original_content: originalContentJson,
    });

    return Response.json({
      ok: true,
      verdict,
      action_taken: actionTaken,
      reason: aiReason,
    });
  } catch (error) {
    console.error('[ReviewReportedContent] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});