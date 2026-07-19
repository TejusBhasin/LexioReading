import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, subject, message } = await req.json();

    if (!email || !subject || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email format to prevent abuse
    const emailStr = String(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr) || emailStr.length > 254) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Cap lengths to prevent flooding
    const subjectStr = String(subject).trim().slice(0, 200);
    const messageStr = String(message).trim().slice(0, 5000);
    const nameStr = String(name || emailStr).slice(0, 100);
    if (!subjectStr || !messageStr) {
      return Response.json({ error: 'Subject and message cannot be empty' }, { status: 400 });
    }

    // Store the support request so admins can view and respond in the dashboard
    await base44.asServiceRole.entities.ContactRequest.create({
      user_email: emailStr,
      username: nameStr,
      subject: subjectStr,
      message: messageStr,
      status: 'open',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});