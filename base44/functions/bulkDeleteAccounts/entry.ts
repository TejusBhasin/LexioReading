import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { school_id, emails, reason } = body;

    if (!school_id || !emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ error: 'school_id and emails array required' }, { status: 400 });
    }

    // Verify caller is a school admin (not semi_admin — only full admins can delete accounts)
    const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
      user_email: user.email,
      school_id,
      kicked: false,
    });
    const adminMembership = memberships.find(m => m.role === 'admin');
    if (!adminMembership) {
      return Response.json({ error: 'Only school admins can bulk delete accounts.' }, { status: 403 });
    }

    // Get all school members to validate emails (non-admin, non-archived)
    const schoolMembers = await base44.asServiceRole.entities.SchoolMember.filter({
      school_id,
      kicked: false,
    });
    const schoolEmails = schoolMembers.filter(m => m.role !== 'admin').map(m => m.user_email);

    // Get all classes in school for removal
    const classes = await base44.asServiceRole.entities.SchoolClass.filter({ school_id });

    const results = [];
    const now = new Date().toISOString();
    const archiveReason = reason?.trim() || 'Bulk deleted by school admin';

    for (const rawEmail of emails) {
      const email = (rawEmail || '').trim().toLowerCase();
      if (!email || !email.includes('@')) continue;

      // Verify email belongs to this school
      if (!schoolEmails.includes(email)) {
        results.push({ email, status: 'skipped', reason: 'Not an active member of your school' });
        continue;
      }

      try {
        // Get user ID for created_by_id-based entities
        const users = await base44.asServiceRole.entities.User.filter({ email });
        const userId = users[0]?.id;

        // Delete user-generated content and data (parallel)
        await Promise.all([
          base44.asServiceRole.entities.ReadingLog.deleteMany({ user_email: email }),
          base44.asServiceRole.entities.Review.deleteMany({ user_email: email }),
          base44.asServiceRole.entities.UserLibrary.deleteMany({ user_email: email }),
          base44.asServiceRole.entities.UserPreferences.deleteMany({ user_email: email }),
          base44.asServiceRole.entities.UserProfile.deleteMany({ user_email: email }),
          base44.asServiceRole.entities.VaultEntry.deleteMany({ user_email: email }),
          base44.asServiceRole.entities.VaultPin.deleteMany({ user_email: email }),
          base44.asServiceRole.entities.Notification.deleteMany({ user_email: email }),
          base44.asServiceRole.entities.ClubPost.deleteMany({ user_email: email }),
          base44.asServiceRole.entities.ClubPostReply.deleteMany({ user_email: email }),
          base44.asServiceRole.entities.UserPoints.deleteMany({ user_email: email }),
          base44.asServiceRole.entities.ReadingGoal.deleteMany({ user_email: email }),
        ]);

        // Delete created_by_id-based entities if we have the user ID
        if (userId) {
          await Promise.all([
            base44.asServiceRole.entities.BookClick.deleteMany({ created_by_id: userId }),
            base44.asServiceRole.entities.ForumPost.deleteMany({ created_by_id: userId }).catch(() => {}),
            base44.asServiceRole.entities.ForumComment.deleteMany({ created_by_id: userId }).catch(() => {}),
            base44.asServiceRole.entities.Discussion.deleteMany({ created_by_id: userId }).catch(() => {}),
            base44.asServiceRole.entities.ChatMessage.deleteMany({ created_by_id: userId }).catch(() => {}),
          ]);

          // Delete the User account itself
          try {
            await base44.asServiceRole.entities.User.delete(userId);
          } catch (userDelErr) {
            // User deletion may fail due to platform restrictions — data is still wiped
          }
        }

        // Archive the SchoolMember record
        const memberRecords = await base44.asServiceRole.entities.SchoolMember.filter({
          user_email: email,
          school_id,
        });
        for (const m of memberRecords) {
          await base44.asServiceRole.entities.SchoolMember.update(m.id, {
            kicked: true,
            archived: true,
            archived_at: now,
            archived_by: user.email,
            archive_reason: archiveReason,
          });
        }

        // Remove from all classes
        for (const cls of classes) {
          if (cls.student_emails && cls.student_emails.includes(email)) {
            const updated = cls.student_emails.filter(e => e !== email);
            await base44.asServiceRole.entities.SchoolClass.update(cls.id, { student_emails: updated });
          }
        }

        results.push({ email, status: 'deleted' });
      } catch (e) {
        results.push({ email, status: 'error', reason: e.message });
      }
    }

    const deleted = results.filter(r => r.status === 'deleted').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const errors = results.filter(r => r.status === 'error').length;

    return Response.json({
      success: true,
      summary: { total: results.length, deleted, skipped, errors },
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});