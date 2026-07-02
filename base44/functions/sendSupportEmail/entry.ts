import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, subject, message } = await req.json();

    if (!email || !subject || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store the support request so admins can view and respond in the dashboard
    await base44.asServiceRole.entities.ContactRequest.create({
      user_email: email,
      username: name || email,
      subject: subject,
      message: message,
      status: 'open',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});