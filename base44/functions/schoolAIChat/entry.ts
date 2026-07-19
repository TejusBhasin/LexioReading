import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { school_id, class_id, question, mode, student_email } = body;

    // Verify user is admin, semi_admin, or teacher of the class
    const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
      user_email: user.email,
      school_id,
      kicked: false
    });
    const membership = memberships.find(m => m.role === 'admin' || m.role === 'semi_admin');
    let isTeacher = false;
    if (!membership) {
      if (class_id) {
        const teacherClasses = await base44.asServiceRole.entities.SchoolClass.filter({ id: class_id, school_id });
        if (teacherClasses[0] && teacherClasses[0].teacher_email === user.email) {
          isTeacher = true;
        }
      }
      if (!isTeacher) {
        return Response.json({ error: 'Not authorized. Only school admins, sub-admins, and class teachers can use the AI assistant.' }, { status: 403 });
      }
    }
    // Teachers can only query their own class, not school-wide
    if (isTeacher && !class_id) {
      return Response.json({ error: 'Please select a class to analyze.' }, { status: 400 });
    }

    // Determine scope: class-wide or school-wide
    let studentEmails = [];
    let className = null;
    const schoolName = membership.school_name;

    if (class_id) {
      const classes = await base44.asServiceRole.entities.SchoolClass.filter({ id: class_id, school_id });
      if (!classes[0]) return Response.json({ error: 'Class not found' }, { status: 404 });
      className = classes[0].class_name;
      studentEmails = classes[0].student_emails || [];
    } else {
      const members = await base44.asServiceRole.entities.SchoolMember.filter({
        school_id,
        kicked: false
      });
      studentEmails = members.filter(m => m.role !== 'admin').map(m => m.user_email);
    }

    // Student-specific scope overrides class/school scope
    if (student_email) {
      // Verify the requested student belongs to the caller's authorized school
      const studentMemberships = await base44.asServiceRole.entities.SchoolMember.filter({
        user_email: student_email,
        school_id,
        kicked: false,
      });
      if (studentMemberships.length === 0) {
        return Response.json({ error: 'Student is not a member of your school.' }, { status: 404 });
      }
      studentEmails = [student_email];
      className = null;
    }

    if (studentEmails.length === 0) {
      const emptyMsg = class_id
        ? 'There are no students in this class yet. Add students to the class first.'
        : 'There are no students in this school yet.';
      return Response.json({ answer: emptyMsg });
    }

    // Gather reading data for all students in batches
    const allLogs = [];
    const allLibs = [];
    const allReviews = [];
    const memberMap = {};

    const allMembers = await base44.asServiceRole.entities.SchoolMember.filter({
      school_id,
      kicked: false
    });
    allMembers.forEach(m => { memberMap[m.user_email] = m; });

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

    // Compile per-student stats
    const studentStats = studentEmails.map(email => {
      const sLogs = allLogs.filter(l => l.user_email === email);
      const sLibs = allLibs.filter(l => l.user_email === email);
      const sReviews = allReviews.filter(r => r.user_email === email);
      const totalMinutes = sLogs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);
      const booksRead = sLibs.filter(l => l.status === 'finished').length;
      const booksReading = sLibs.filter(l => l.status === 'reading').length;
      const wantToRead = sLibs.filter(l => l.status === 'want_to_read').length;
      const avgRating = sReviews.length > 0
        ? (sReviews.reduce((s, r) => s + (r.rating || 0), 0) / sReviews.length).toFixed(1)
        : null;
      const lastLog = sLogs.length > 0 ? sLogs.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
      const bookTitles = [...new Set(sLogs.map(l => l.book_title).filter(Boolean))];
      const username = memberMap[email]?.username || email.split('@')[0];
      return {
        email,
        username,
        sessions: sLogs.length,
        totalMinutes,
        booksRead,
        booksReading,
        wantToRead,
        reviews: sReviews.length,
        avgRating,
        lastActivity: lastLog?.date?.slice(0, 10) || null,
        recentBooks: bookTitles.slice(-5),
      };
    });

    // Aggregate stats
    const totalSessions = allLogs.length;
    const totalMinutes = allLogs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);
    const totalBooksFinished = allLibs.filter(l => l.status === 'finished').length;
    const totalReviews = allReviews.length;
    const activeStudents = studentStats.filter(s => s.sessions > 0).length;
    const inactiveStudents = studentStats.filter(s => s.sessions === 0);

    // Top books
    const bookCounts = {};
    allLogs.forEach(l => {
      if (l.book_title) bookCounts[l.book_title] = (bookCounts[l.book_title] || 0) + 1;
    });
    const topBooks = Object.entries(bookCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([title, count]) => `${title} (${count} sessions)`);

    // Build context
    const scope = student_email ? `student "${memberMap[student_email]?.username || student_email}"` : class_id ? `the class "${className}"` : `the school "${schoolName}"`;
    const context = `SCOPE: ${scope}
TOTAL STUDENTS: ${studentEmails.length}
ACTIVE STUDENTS (with reading sessions): ${activeStudents}
INACTIVE STUDENTS (no reading sessions): ${inactiveStudents.length}

AGGREGATE STATS:
- Total reading sessions: ${totalSessions}
- Total reading minutes: ${totalMinutes}
- Total books finished: ${totalBooksFinished}
- Total reviews written: ${totalReviews}
- Average minutes per student: ${studentEmails.length > 0 ? Math.round(totalMinutes / studentEmails.length) : 0}

TOP BOOKS (by reading sessions):
${topBooks.length > 0 ? topBooks.map(b => '- ' + b).join('\n') : 'No reading sessions logged yet.'}

PER-STUDENT BREAKDOWN:
${studentStats.map(s => `- ${s.username} (${s.email}): ${s.sessions} sessions, ${s.totalMinutes} min, ${s.booksRead} finished, ${s.booksReading} reading, ${s.wantToRead} want-to-read, ${s.reviews} reviews${s.avgRating ? ', avg rating ' + s.avgRating : ''}${s.lastActivity ? ', last active ' + s.lastActivity : ', no activity'}${s.recentBooks.length > 0 ? ', recent books: ' + s.recentBooks.join(', ') : ''}`).join('\n')}

INACTIVE STUDENTS (may need encouragement):
${inactiveStudents.length > 0 ? inactiveStudents.map(s => '- ' + s.username + ' (' + s.email + ')').join('\n') : 'None - all students have reading activity.'}
`;

    const userRoleLabel = isTeacher ? 'teacher' : 'school administrator';
    let prompt;
    if (mode === 'overview') {
      if (student_email) {
        prompt = `You are an AI reading analytics assistant for a ${userRoleLabel}. Based on the data below, provide a concise overview (2-3 short paragraphs) of this student's reading activity and engagement.

Cover:
1. Reading engagement level and key metrics
2. Reading preferences and patterns
3. Recommendations for growth or areas to encourage

Be specific and reference actual data. Use a professional but supportive tone.

DATA:
${context}`;
      } else {
        prompt = `You are an AI reading analytics assistant for a ${userRoleLabel}. Based on the data below, provide a comprehensive but concise overview (3-4 short paragraphs) of reading activity for ${scope}.

Cover:
1. Overall engagement level and key metrics
2. Top performers and stand-out students
3. Students who may need encouragement or intervention
4. Popular books and reading trends
5. Any notable patterns or recommendations

Be specific and reference actual data. Use a professional but friendly tone.

DATA:
${context}`;
      }
    } else {
      prompt = `You are an AI reading analytics assistant for a ${userRoleLabel}. You have access to real reading data from ${scope}. Answer the ${userRoleLabel}'s question based on the data below. Be specific and reference actual numbers and student names. If there's not enough data to answer, say so. Keep answers concise but informative.

DATA:
${context}

QUESTION: ${question}`;
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
    });

    return Response.json({ answer: typeof result === 'string' ? result : String(result) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});