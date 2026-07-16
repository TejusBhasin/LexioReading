import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { school_id, student_email } = body;

    if (!school_id || !student_email) {
      return Response.json({ error: 'school_id and student_email required' }, { status: 400 });
    }

    // Verify user is admin or semi_admin of the school
    const memberships = await base44.asServiceRole.entities.SchoolMember.filter({
      user_email: user.email,
      school_id,
      kicked: false,
    });
    const membership = memberships.find(m => m.role === 'admin' || m.role === 'semi_admin');
    if (!membership) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get school for data_access_fields
    const schools = await base44.asServiceRole.entities.School.filter({ id: school_id });
    const school = schools[0];
    if (!school) return Response.json({ error: 'School not found' }, { status: 404 });

    const accessFields = school.data_access_fields?.length > 0
      ? school.data_access_fields
      : ['reading_logs', 'library', 'reviews'];

    // Verify the student is a member of this school
    const studentMembers = await base44.asServiceRole.entities.SchoolMember.filter({
      school_id,
      user_email: student_email,
      kicked: false,
    });
    if (!studentMembers[0]) {
      return Response.json({ error: 'Student not found in this school' }, { status: 404 });
    }
    const studentMember = studentMembers[0];

    const result = {
      username: studentMember.username || student_email.split('@')[0],
      email: student_email,
      joined_date: studentMember.joined_date,
      role: studentMember.role,
      data: {},
    };

    const safe = (p) => p.catch(() => []);

    if (accessFields.includes('reading_logs')) {
      const logs = await safe(base44.asServiceRole.entities.ReadingLog.filter({ user_email: student_email }));
      const totalMinutes = logs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);
      result.data.reading_logs = {
        sessions: logs.length,
        total_minutes: totalMinutes,
        recent: logs
          .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
          .slice(0, 15)
          .map(l => ({
            book_title: l.book_title,
            time_spent: l.time_spent_minutes,
            mood: l.mood,
            date: l.created_date?.slice(0, 10),
            notes: l.notes,
          })),
      };
    }

    if (accessFields.includes('library')) {
      const libs = await safe(base44.asServiceRole.entities.UserLibrary.filter({ user_email: student_email }));
      result.data.library = {
        total: libs.length,
        finished: libs.filter(l => l.status === 'finished').length,
        reading: libs.filter(l => l.status === 'reading').length,
        want_to_read: libs.filter(l => l.status === 'want_to_read').length,
        recent: libs.slice(0, 15).map(l => ({
          title: l.book_title,
          author: l.book_author,
          status: l.status,
          rating: l.rating,
          cover: l.book_cover,
        })),
      };
    }

    if (accessFields.includes('reviews')) {
      const reviews = await safe(base44.asServiceRole.entities.Review.filter({ user_email: student_email }));
      result.data.reviews = {
        total: reviews.length,
        avg_rating: reviews.length > 0
          ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
          : null,
        recent: reviews.slice(0, 10).map(r => ({
          book_title: r.book_title,
          rating: r.rating,
          content: r.content?.slice(0, 200),
          date: r.created_date?.slice(0, 10),
        })),
      };
    }

    if (accessFields.includes('reading_goals')) {
      const goals = await safe(base44.asServiceRole.entities.ReadingGoal.filter({ user_email: student_email }));
      result.data.reading_goals = goals.map(g => ({
        year: g.year,
        target_books: g.target_books,
        target_pages: g.target_pages,
        notes: g.notes,
      }));
    }

    if (accessFields.includes('points_streaks')) {
      const points = await safe(base44.asServiceRole.entities.UserPoints.filter({ user_email: student_email }));
      result.data.points_streaks = points[0] ? {
        total_points: points[0].total_points,
        streak: points[0].streak,
        streak_freezes: points[0].streak_freezes,
      } : null;
    }

    if (accessFields.includes('preferences')) {
      const prefs = await safe(base44.asServiceRole.entities.UserPreferences.filter({ user_email: student_email }));
      result.data.preferences = prefs[0] ? {
        favorite_genres: prefs[0].favorite_genres,
        pacing: prefs[0].pacing,
        difficulty: prefs[0].difficulty,
      } : null;
    }

    if (accessFields.includes('forum_activity')) {
      const posts = await safe(base44.asServiceRole.entities.ForumPost.filter({ user_email: student_email }));
      const discussions = await safe(base44.asServiceRole.entities.Discussion.filter({ user_email: student_email }));
      result.data.forum_activity = {
        posts: posts.length,
        discussions: discussions.length,
        recent_posts: posts.slice(0, 5).map(p => ({
          title: p.title,
          date: p.created_date?.slice(0, 10),
        })),
      };
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});