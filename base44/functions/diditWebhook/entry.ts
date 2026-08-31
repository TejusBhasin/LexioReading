import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { syncUsername } from '../../shared/syncUsername.ts';

// Didit V2 canonicalisation: whole-number floats -> ints, then recursive lexicographic key sort.
function shortenFloats(v) {
  if (Array.isArray(v)) return v.map(shortenFloats);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shortenFloats(x)]));
  }
  if (typeof v === 'number' && !Number.isInteger(v) && v % 1 === 0) return Math.trunc(v);
  return v;
}
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    return Object.keys(v).sort().reduce((acc, k) => {
      acc[k] = sortKeys(v[k]);
      return acc;
    }, {});
  }
  return v;
}

function hexFromBytes(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default async function(req) {
  try {
    const raw = await req.text();
    const sig = req.headers.get('x-signature-v2') || '';
    const ts = Number(req.headers.get('x-timestamp'));

    // 1. Freshness — reject anything older/newer than 300s (replay protection).
    if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
      return new Response('stale', { status: 401 });
    }

    const secret = secrets.get('DIDIT_WEBHOOK_SECRET');
    if (!secret) return new Response('no secret', { status: 500 });

    // 2. Canonicalise (shortenFloats -> sortKeys -> JSON.stringify with unescaped Unicode).
    const parsed = JSON.parse(raw);
    const canonical = JSON.stringify(sortKeys(shortenFloats(parsed)));

    // 3. Constant-time HMAC-SHA256 compare against X-Signature-V2.
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBuf = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(canonical)));
    const expected = hexFromBytes(sigBuf);
    const expBytes = enc.encode(expected);
    const gotBytes = enc.encode(sig);
    if (expBytes.length !== gotBytes.length) return new Response('bad sig', { status: 401 });
    let diff = 0;
    for (let i = 0; i < expBytes.length; i++) diff |= expBytes[i] ^ gotBytes[i];
    if (diff !== 0) return new Response('bad sig', { status: 401 });

    // 4. Apply the decision (status strings are case-sensitive literals).
    const base44 = createClientFromRequest(req);
    const vendorData = parsed.vendor_data;
    if (vendorData) {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: vendorData });
      if (profiles[0]) {
        let patch = {};
        switch (parsed.status) {
          case 'Approved':
            patch = { is_verified: true, verification_status: 'approved', verified_at: new Date().toISOString(), username: (profiles[0].verified_real_name || profiles[0].username || '').replace(/ /g, '_').toLowerCase() };
            break;
          case 'Declined':
            patch = { is_verified: false, verification_status: 'declined' };
            break;
          case 'In Review':
            patch = { verification_status: 'in_review' };
            break;
          case 'In Progress':
            patch = { verification_status: 'in_progress' };
            break;
          case 'Awaiting User':
            patch = { verification_status: 'awaiting_user' };
            break;
          case 'Resubmitted':
            patch = { verification_status: 'resubmitted' };
            break;
          case 'Abandoned':
            patch = { verification_status: 'abandoned' };
            break;
          case 'Expired':
            patch = { verification_status: 'expired' };
            break;
          case 'Kyc Expired':
            patch = { is_verified: false, verification_status: 'expired' };
            break;
          default:
            break;
        }
        if (Object.keys(patch).length) {
          await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, patch);
          if (patch.username) {
            await syncUsername(base44, vendorData, patch.username);
          }
        }
      }
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    return new Response('error', { status: 500 });
  }
}