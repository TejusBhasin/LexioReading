import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Unambiguous alphabet: no 0/O/1/I/l confusables. Symbols safe for copy/paste.
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$&*?';

function genKey(len = 30) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CHARS[arr[i] % CHARS.length];
  }
  return out;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));

    let key = genKey(30);
    let existing = await base44.asServiceRole.entities.VerificationKey.filter({ key });
    while (existing.length > 0) {
      key = genKey(30);
      existing = await base44.asServiceRole.entities.VerificationKey.filter({ key });
    }

    const created = await base44.asServiceRole.entities.VerificationKey.create({
      key,
      created_by_email: user.email,
      is_used: false,
      notes: String(body.notes || '').slice(0, 300),
    });

    return Response.json({ key: created.key, id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}