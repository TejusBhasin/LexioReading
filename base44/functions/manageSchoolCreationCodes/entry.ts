import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // Admin-only actions
    if (['create', 'list', 'deactivate', 'delete'].includes(action)) {
      if (user.role !== 'admin') {
        return Response.json({ error: 'Only platform admins can manage school creation codes.' }, { status: 403 });
      }
    }

    if (action === 'create') {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let code = '';
      for (let i = 0; i < 300; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      const { notes } = body;
      const record = await base44.asServiceRole.entities.SchoolCreationCode.create({
        code,
        created_by_email: user.email,
        is_used: false,
        is_active: true,
        notes: notes || '',
      });
      return Response.json({ code: record });
    }

    if (action === 'list') {
      const codes = await base44.asServiceRole.entities.SchoolCreationCode.list('-created_date', 100);
      return Response.json({ codes });
    }

    if (action === 'deactivate') {
      const { code_id } = body;
      await base44.asServiceRole.entities.SchoolCreationCode.update(code_id, { is_active: false });
      return Response.json({ success: true });
    }

    if (action === 'delete') {
      const { code_id } = body;
      await base44.asServiceRole.entities.SchoolCreationCode.delete(code_id);
      return Response.json({ success: true });
    }

    // User action: validate
    if (action === 'validate') {
      const { code } = body;
      if (!code || code.length !== 300) {
        return Response.json({ valid: false, error: 'Invalid code format.' });
      }
      const codes = await base44.asServiceRole.entities.SchoolCreationCode.filter({ code, is_active: true, is_used: false });
      if (!codes[0]) {
        return Response.json({ valid: false, error: 'Invalid or already used code.' });
      }
      return Response.json({ valid: true, code_id: codes[0].id });
    }

    // User action: consume (mark as used when school is created)
    if (action === 'consume') {
      const { code_id, school_id, school_name } = body;
      const codes = await base44.asServiceRole.entities.SchoolCreationCode.filter({ id: code_id, is_active: true, is_used: false });
      if (!codes[0]) {
        return Response.json({ error: 'Invalid or already used code.' }, { status: 400 });
      }
      await base44.asServiceRole.entities.SchoolCreationCode.update(code_id, {
        is_used: true,
        used_by_email: user.email,
        school_id,
        school_name,
      });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});