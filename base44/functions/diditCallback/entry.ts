// Didit verification callback. Didit loads this URL inside an iframe at the end
// of its hosted flow. Lexio's app pages send X-Frame-Options and can't be
// framed, so this endpoint returns a bare HTML page that breaks out of the
// iframe and sends the user (top-level) back to their profile, where the
// IdentityVerification component polls for the webhook result.
export default async function (_req) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Returning to Lexio…</title><style>html,body{height:100%;margin:0}body{font-family:-apple-system,system-ui,sans-serif;background:#0a0a0a;color:#f5f0e8;display:flex;align-items:center;justify-content:center;font-size:14px}</style></head><body><p>Identity check complete — returning to Lexio…</p><script>try{window.top.location.href='https://lexio-reading.base44.app/profile';}catch(e){try{window.location.href='https://lexio-reading.base44.app/profile';}catch(_){}}</script></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}