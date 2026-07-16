import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, school_id, class_id, class_data } = body;

    // ─── get_class_stats: accessible by teachers, admins, and semi_admins ───
    if (action === 'get_class_stats') {
      const classes = await base44.asServiceRole.entities.SchoolClass.filter({ id: class_id });
      if (!classes[0]) return Response.json({ error: 'Class not found' }, { status: 404 });
      const cls = classes[0];

      const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
        user_email: user.email,
        school_id: cls.school_id,
        kicked: false
      });
      const isTeacher = cls.teacher_email === user.email;
      const isAdmin = memberships.some(m => m.role === 'admin' || m.role === 'semi_admin');
      if (!isTeacher && !isAdmin) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }

      const studentEmails = cls.student_emails || [];
      const memberMap = {};
      const allMembers = await base44.asServiceRole.entities.SchoolMember.filter({
        school_id: cls.school_id,
        kicked: false
      });
      allMembers.forEach(m => { memberMap[m.user_email] = m; });

      const allLogs = [];
      const allLibs = [];
      const allReviews = [];

      const batchSize = 20;
      for (let i = 0; i < studentEmails.length; i += batchSize) {
        const batch = studentEmails.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async email => {
            const [logs, libs, revs] = await Promise.all([
              base44.asServiceRole.entities.ReadingLog.filter({ user_email: email }).catch(() => []),
              base44.asServiceRole.entities.UserLibrary.filter({ user_email: email }).catch(() => []),
              base44.asServiceRole.entities.Review.filter({ user_email: email }).catch(() => []),
            ]);
            return { email, logs, libs, revs };
          })
        );
        results.forEach(r => {
          allLogs.push(...r.logs);
          allLibs.push(...r.libs);
          allReviews.push(...r.revs);
        });
      }

      const studentStats = studentEmails.map(email => {
        const sLogs = allLogs.filter(l => l.user_email === email);
        const sLibs = allLibs.filter(l => l.user_email === email);
        sLibs.filter(l => l.user_email === email);
        const sReviews = allReviews.filter(r => r.user_email === email);
        const totalMinutes = sLogs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);
        const lastLog = sLogs.length > 0 ? sLogs.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
        return {
          email,
          username: memberMap[email]?.username || email.split('@')[0],
          sessions: sLogs.length,
          totalMinutes,
          booksFinished: sLibs.filter(l => l.status === 'finished').length,
          booksReading: sLibs.filter(l => l.status === 'reading').length,
          reviews: sReviews.length,
          avgRating: sReviews.length > 0 ? parseFloat((sReviews.reduce((s, r) => s + (r.rating || 0), 0) / sReviews.length).toFixed(1)) : null,
          lastActivity: lastLog?.date || null,
        };
      });

      const bookCounts = {};
      allLogs.forEach(l => {
        if (l.book_title) bookCounts[l.book_title] = (bookCounts[l.book_title] || 0) + 1;
      });
      const topBooks = Object.entries(bookCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([title, count]) => ({ title, sessions: count }));

      return Response.json({
        class: cls,
        canUseAI: isAdmin,
        studentStats,
        aggregate: {
          totalStudents: studentEmails.length,
          totalSessions: allLogs.length,
          totalMinutes: allLogs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0),
          totalBooksFinished: allLibs.filter(l => l.status === 'finished').length,
          totalReviews: allReviews.length,
        },
        topBooks,
      });
    }

    // ─── All other actions require admin or semi_admin ───
    if (!school_id) return Response.json({ error: 'school_id required' }, { status: 400 });

    const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
      user_email: user.email,
      school_id,
      kicked: false
    });
    const membership = memberships.find(m => m.role === 'admin' || m.role === 'semi_admin');
    if (!membership) {
      return Response.json({ error: 'Not authorized to manage classes' }, { status: 403 });
    }

    if (action === 'get_members') {
      const members = await base44.asServiceRole.entities.SchoolMember.filter({
        school_id,
        kicked: false
      });
      return Response.json({
        members: members
          .filter(m => m.role !== 'admin')
          .map(m => ({ user_email: m.user_email, username: m.username, role: m.role }))
      });
    }

    if (action === 'create') {
      const created = await base44.asServiceRole.entities.SchoolClass.create({
        ...class_data,
        school_id,
        school_name: membership.school_name,
        created_by_email: user.email,
      });
      return Response.json({ class: created });
    }

    if (action === 'update') {
      const existing = await base44.asServiceRole.entities.SchoolClass.filter({ id: class_id, school_id });
      if (!existing[0]) return Response.json({ error: 'Class not found' }, { status: 404 });
      const updated = await base44.asServiceRole.entities.SchoolClass.update(class_id, class_data);
      return Response.json({ class: updated });
    }

    if (action === 'delete') {
      const existing = await base44.asServiceRole.entities.SchoolClass.filter({ id: class_id, school_id });
      if (!existing[0]) return Response.json({ error: 'Class not found' }, { status: 404 });
      await base44.asServiceRole.entities.SchoolClass.delete(class_id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});