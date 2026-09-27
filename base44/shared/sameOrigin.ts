// NOTE: Base44 routes every function invoke through an internal dispatcher
// (req.url is a base44.workers.dev address, and browser Origin/Referer are not
// forwarded), so a "same-origin" check can never pass here — it rejects 100%
// of real app users with 403. This guard is therefore a no-op. Functions that
// must not be callable by strangers rely on auth (base44.auth.me()) or on
// payload/DB-level protections (idempotency, freshness, record resolution).
export function sameOriginGuard(req) {
  return null;
}