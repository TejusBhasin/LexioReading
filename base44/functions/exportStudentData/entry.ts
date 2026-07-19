import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { student_email, school_id } = body;

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
      return Response.json({ error: 'Only school admins and sub-admins can export student data.' }, { status: 403 });
    }

    // Use the admin's own school_id as the trust boundary — ignore any school_id from the body
    const sid = adminMembership.school_id;
    if (school_id && school_id !== sid) {
      return Response.json({ error: 'You can only export data for students in your own school.' }, { status: 403 });
    }

    // Verify target is/was in this school
    const studentMembers = await base44.asServiceRole.entities.SchoolMember.filter({
      user_email: student_email,
      school_id: sid,
    });
    if (studentMembers.length === 0) {
      return Response.json({ error: 'Student is not a member of your school.' }, { status: 404 });
    }
    const studentMember = studentMembers[0];

    // Get school for data_access_fields
    const schools = await base44.asServiceRole.entities.School.filter({ id: sid });
    const school = schools[0];
    const accessFields = school?.data_access_fields?.length > 0
      ? school.data_access_fields
      : ['reading_logs', 'library', 'reviews'];

    const safe = (p) => p.catch(() => []);

    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        exported_by: user.email,
        school_name: studentMember.school_name || school?.name || 'Unknown',
        student_email,
        student_username: studentMember.username || student_email.split('@')[0],
        joined_date: studentMember.joined_date,
        role: studentMember.role,
        archived: studentMember.archived || false,
      },
      data: {},
    };

    if (accessFields.includes('reading_logs')) {
      const logs = await safe(base44.asServiceRole.entities.ReadingLog.filter({ user_email: student_email }));
      exportData.data.reading_logs = logs.map(l => ({
        book_title: l.book_title,
        time_spent_minutes: l.time_spent_minutes,
        mood: l.mood,
        date: l.created_date,
        notes: l.notes,
        pages_read: l.pages_read,
      }));
    }

    if (accessFields.includes('library')) {
      const libs = await safe(base44.asServiceRole.entities.UserLibrary.filter({ user_email: student_email }));
      exportData.data.library = libs.map(l => ({
        book_title: l.book_title,
        book_author: l.book_author,
        status: l.status,
        rating: l.rating,
        date_added: l.date_added,
        notes: l.notes,
        current_page: l.current_page,
      }));
    }

    if (accessFields.includes('reviews')) {
      const reviews = await safe(base44.asServiceRole.entities.Review.filter({ user_email: student_email }));
      exportData.data.reviews = reviews.map(r => ({
        book_title: r.book_title,
        rating: r.rating,
        content: r.content,
        date: r.created_date,
        tags: r.tags,
      }));
    }

    if (accessFields.includes('reading_goals')) {
      const goals = await safe(base44.asServiceRole.entities.ReadingGoal.filter({ user_email: student_email }));
      exportData.data.reading_goals = goals.map(g => ({
        year: g.year,
        target_books: g.target_books,
        target_pages: g.target_pages,
        notes: g.notes,
      }));
    }

    if (accessFields.includes('points_streaks')) {
      const points = await safe(base44.asServiceRole.entities.UserPoints.filter({ user_email: student_email }));
      exportData.data.points_streaks = points[0] ? {
        total_points: points[0].total_points,
        streak: points[0].streak,
        streak_freezes: points[0].streak_freezes,
      } : null;
    }

    if (accessFields.includes('preferences')) {
      const prefs = await safe(base44.asServiceRole.entities.UserPreferences.filter({ user_email: student_email }));
      exportData.data.preferences = prefs[0] ? {
        favorite_genres: prefs[0].favorite_genres,
        pacing: prefs[0].pacing,
        difficulty: prefs[0].difficulty,
      } : null;
    }

    if (accessFields.includes('forum_activity')) {
      const posts = await safe(base44.asServiceRole.entities.ForumPost.filter({ user_email: student_email }));
      const discussions = await safe(base44.asServiceRole.entities.Discussion.filter({ user_email: student_email }));
      exportData.data.forum_activity = {
        posts: posts.map(p => ({ title: p.title, date: p.created_date })),
        discussions: discussions.map(d => ({ book_title: d.book_title, content: d.content?.slice(0, 200), date: d.created_date })),
      };
    }

    // Return as downloadable JSON
    const jsonStr = JSON.stringify(exportData, null, 2);
    const safeName = (studentMember.username || student_email.split('@')[0]).replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);

    return new Response(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${safeName}_reading_data_${dateStr}.json"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});