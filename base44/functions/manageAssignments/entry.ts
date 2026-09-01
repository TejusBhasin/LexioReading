import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ─── create ───
    if (action === 'create') {
      const { class_id, assignment_data } = body;
      if (!class_id) return Response.json({ error: 'class_id required' }, { status: 400 });

      const classes = await base44.asServiceRole.entities.SchoolClass.filter({ id: class_id });
      if (!classes[0]) return Response.json({ error: 'Class not found' }, { status: 404 });
      const cls = classes[0];

      const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
        user_email: user.email, school_id: cls.school_id, kicked: false,
      });
      const isTeacher = cls.teacher_email === user.email;
      const isAdmin = memberships.some(m => m.role === 'admin' || m.role === 'semi_admin');
      if (!isTeacher && !isAdmin) return Response.json({ error: 'Not authorized' }, { status: 403 });

      const created = await base44.asServiceRole.entities.Assignment.create({
        ...assignment_data,
        school_id: cls.school_id,
        class_id,
        class_name: cls.class_name,
        teacher_email: user.email,
        teacher_name: memberships[0]?.username || user.full_name || user.email,
      });
      return Response.json({ assignment: created });
    }

    // ─── update ───
    if (action === 'update') {
      const { assignment_id, assignment_data } = body;
      const assignments = await base44.asServiceRole.entities.Assignment.filter({ id: assignment_id });
      if (!assignments[0]) return Response.json({ error: 'Assignment not found' }, { status: 404 });
      const a = assignments[0];
      if (a.teacher_email !== user.email) {
        const classes = await base44.asServiceRole.entities.SchoolClass.filter({ id: a.class_id });
        const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
          user_email: user.email, school_id: classes[0]?.school_id, kicked: false,
        });
        if (!memberships.some(m => m.role === 'admin')) return Response.json({ error: 'Not authorized' }, { status: 403 });
      }
      const updated = await base44.asServiceRole.entities.Assignment.update(assignment_id, assignment_data);
      return Response.json({ assignment: updated });
    }

    // ─── delete ───
    if (action === 'delete') {
      const { assignment_id } = body;
      const assignments = await base44.asServiceRole.entities.Assignment.filter({ id: assignment_id });
      if (!assignments[0]) return Response.json({ error: 'Assignment not found' }, { status: 404 });
      const a = assignments[0];
      if (a.teacher_email !== user.email) {
        const classes = await base44.asServiceRole.entities.SchoolClass.filter({ id: a.class_id });
        const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
          user_email: user.email, school_id: classes[0]?.school_id, kicked: false,
        });
        if (!memberships.some(m => m.role === 'admin')) return Response.json({ error: 'Not authorized' }, { status: 403 });
      }
      await base44.asServiceRole.entities.AssignmentSubmission.deleteMany({ assignment_id });
      await base44.asServiceRole.entities.Assignment.delete(assignment_id);
      return Response.json({ success: true });
    }

    // ─── get_class_assignments (teacher view) ───
    if (action === 'get_class_assignments') {
      const { class_id } = body;
      if (!class_id) return Response.json({ error: 'class_id required' }, { status: 400 });
      const classes = await base44.asServiceRole.entities.SchoolClass.filter({ id: class_id });
      if (!classes[0]) return Response.json({ error: 'Class not found' }, { status: 404 });
      const cls = classes[0];
      const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
        user_email: user.email, school_id: cls.school_id, kicked: false,
      });
      const isTeacher = cls.teacher_email === user.email;
      const isAdmin = memberships.some(m => m.role === 'admin' || m.role === 'semi_admin');
      if (!isTeacher && !isAdmin) return Response.json({ error: 'Not authorized' }, { status: 403 });

      const assignments = await base44.asServiceRole.entities.Assignment.filter({ class_id }, '-created_date');
      const submissions = [];
      for (const a of assignments) {
        const subs = await base44.asServiceRole.entities.AssignmentSubmission.filter({ assignment_id: a.id });
        submissions.push(...subs);
      }
      return Response.json({ assignments, submissions });
    }

    // ─── get_student_assignments (with auto-complete) ───
    if (action === 'get_student_assignments') {
      const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
        user_email: user.email, kicked: false,
      });
      const schoolIds = [...new Set(memberships.map(m => m.school_id))];
      if (schoolIds.length === 0) return Response.json({ assignments: [] });

      const studentClasses = [];
      for (const sid of schoolIds) {
        const classes = await base44.asServiceRole.entities.SchoolClass.filter({ school_id: sid });
        studentClasses.push(...classes.filter(c => c.student_emails?.includes(user.email) && c.enable_assignments));
      }
      if (studentClasses.length === 0) return Response.json({ assignments: [] });

      const allAssignments = [];
      for (const cls of studentClasses) {
        const assignments = await base44.asServiceRole.entities.Assignment.filter({ class_id: cls.id, is_active: true }, '-created_date');
        allAssignments.push(...assignments);
      }

      const relevant = allAssignments.filter(a => !a.assigned_student_emails?.length || a.assigned_student_emails.includes(user.email));

      const [readingLogs, library] = await Promise.all([
        base44.asServiceRole.entities.ReadingLog.filter({ user_email: user.email }).catch(() => []),
        base44.asServiceRole.entities.UserLibrary.filter({ user_email: user.email }).catch(() => []),
      ]);

      const allSubmissions = [];
      for (const a of relevant) {
        const subs = await base44.asServiceRole.entities.AssignmentSubmission.filter({ assignment_id: a.id, student_email: user.email });
        allSubmissions.push(...subs);
      }

      // Auto-complete check
      for (const assignment of relevant) {
        const existingSub = allSubmissions.find(s => s.assignment_id === assignment.id);
        if (existingSub && (existingSub.status === 'completed' || existingSub.status === 'auto_completed')) continue;

        const createdDate = new Date(assignment.created_date);
        let autoDone = false;
        let bookTitle = '';
        let timeSpent = 0;

        if (assignment.assignment_type === 'specific_book') {
          const inLib = library.find(l => l.book_id === assignment.target_book_id);
          const inLogs = readingLogs.find(l => l.book_id === assignment.target_book_id);
          if (inLib || inLogs) { autoDone = true; bookTitle = assignment.target_book_title || ''; }
        } else if (assignment.assignment_type === 'any_book') {
          const recentLogs = readingLogs.filter(l => new Date(l.created_date) >= createdDate);
          timeSpent = recentLogs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);
          if (assignment.time_requirement_minutes && timeSpent >= assignment.time_requirement_minutes) {
            autoDone = true; bookTitle = recentLogs[0]?.book_title || '';
          } else if (!assignment.time_requirement_minutes && recentLogs.length > 0) {
            autoDone = true; bookTitle = recentLogs[0]?.book_title || '';
          }
        }

        if (autoDone) {
          if (existingSub) {
            await base44.asServiceRole.entities.AssignmentSubmission.update(existingSub.id, {
              status: 'auto_completed', auto_completed: true, submitted_book_title: bookTitle,
              time_spent_minutes: timeSpent, submitted_at: new Date().toISOString(),
            });
            existingSub.status = 'auto_completed'; existingSub.auto_completed = true;
            existingSub.submitted_book_title = bookTitle;
          } else {
            const newSub = await base44.asServiceRole.entities.AssignmentSubmission.create({
              assignment_id: assignment.id, student_email: user.email,
              student_name: user.full_name || user.email,
              status: 'auto_completed', auto_completed: true, submitted_book_title: bookTitle,
              time_spent_minutes: timeSpent, submitted_at: new Date().toISOString(),
            });
            allSubmissions.push(newSub);
          }
        }
      }

      const enriched = relevant.map(a => ({
        ...a,
        class_name: studentClasses.find(c => c.id === a.class_id)?.class_name || '',
        submission: allSubmissions.find(s => s.assignment_id === a.id) || null,
      }));
      return Response.json({ assignments: enriched });
    }

    // ─── mark_done ───
    if (action === 'mark_done') {
      const { assignment_id, book_title } = body;
      const assignments = await base44.asServiceRole.entities.Assignment.filter({ id: assignment_id, is_active: true });
      if (!assignments[0]) return Response.json({ error: 'Assignment not found' }, { status: 404 });
      const a = assignments[0];

      const classes = await base44.asServiceRole.entities.SchoolClass.filter({ id: a.class_id });
      const cls = classes[0];
      const inClass = cls?.student_emails?.includes(user.email);
      const assigned = a.assigned_student_emails?.includes(user.email);
      if (!inClass && !assigned) return Response.json({ error: 'Not assigned to you' }, { status: 403 });

      const existing = await base44.asServiceRole.entities.AssignmentSubmission.filter({ assignment_id, student_email: user.email });
      if (existing[0]) {
        const updated = await base44.asServiceRole.entities.AssignmentSubmission.update(existing[0].id, {
          status: 'completed', auto_completed: false,
          submitted_book_title: book_title || existing[0].submitted_book_title || '',
          submitted_at: new Date().toISOString(),
        });
        return Response.json({ submission: updated });
      }
      const created = await base44.asServiceRole.entities.AssignmentSubmission.create({
        assignment_id, student_email: user.email, student_name: user.full_name || user.email,
        status: 'completed', auto_completed: false,
        submitted_book_title: book_title || '', submitted_at: new Date().toISOString(),
      });
      return Response.json({ submission: created });
    }

    // ─── toggle_assignments ───
    if (action === 'toggle_assignments') {
      const { class_id, enabled } = body;
      const classes = await base44.asServiceRole.entities.SchoolClass.filter({ id: class_id });
      if (!classes[0]) return Response.json({ error: 'Class not found' }, { status: 404 });
      const cls = classes[0];
      const isTeacher = cls.teacher_email === user.email;
      const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
        user_email: user.email, school_id: cls.school_id, kicked: false,
      });
      const isAdmin = memberships.some(m => m.role === 'admin' || m.role === 'semi_admin');
      if (!isTeacher && !isAdmin) return Response.json({ error: 'Not authorized' }, { status: 403 });

      const updated = await base44.asServiceRole.entities.SchoolClass.update(class_id, { enable_assignments: enabled });
      return Response.json({ class: updated });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});