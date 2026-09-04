// Same-origin guard for public backend functions on apps with anonymous users.
// The only legitimate caller is the app's own frontend, whose browser always
// sends a same-origin Origin/Referer. Rejects cross-origin callers AND
// headerless callers (curl/scripts) so restricted integrations can't be
// invoked externally to burn the app's integration credits.
export function sameOriginGuard(req) {
  const reqUrl = new URL(req.url);
  const host = reqUrl.host;
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const matchesHost = (h) => { try { return new URL(h).host === host; } catch (e) { return false; } };
  if (origin && !matchesHost(origin)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  if (referer && !matchesHost(referer)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  if (!origin && !referer) return Response.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}