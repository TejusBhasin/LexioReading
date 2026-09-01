import { secrets } from 'base44:runtime';

// Validates the hidden access passcode against a server-side secret.
// Removes the need to ship the passcode in frontend source.
export default async function (req) {
  try {
    const { code } = await req.json().catch(() => ({}));
    const expected = secrets.get('HIDDEN_ACCESS_CODE');
    if (!expected) return Response.json({ valid: false }, { status: 500 });

    const submitted = String(code || '').trim();
    if (!submitted) return Response.json({ valid: false });

    // Constant-time comparison to avoid timing leaks.
    const a = new TextEncoder().encode(submitted);
    const b = new TextEncoder().encode(expected);
    if (a.length !== b.length) return Response.json({ valid: false });
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];

    return Response.json({ valid: diff === 0 });
  } catch (error) {
    return Response.json({ valid: false }, { status: 500 });
  }
}