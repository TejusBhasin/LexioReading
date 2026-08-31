// Propagates a username change across every entity that stores a username
// snapshot, keyed by the author's email. Called after a verified user's
// username is normalized (Didit approval) or manually changed, so that all
// their past content (reviews, posts, comments, discussions…) shows the new
// username and the old username no longer resolves anywhere.
export async function syncUsername(base44, userEmail, newUsername) {
  if (!userEmail || !newUsername) return {};
  const sr = base44.asServiceRole.entities;
  const results = {};

  // Entities keyed by `user_email` with a `username` field
  const emailKeyed = [
    ['Review', sr.Review],
    ['ClubPost', sr.ClubPost],
    ['ClubPostReply', sr.ClubPostReply],
    ['Discussion', sr.Discussion],
    ['UserSafeness', sr.UserSafeness],
    ['ContactRequest', sr.ContactRequest],
    ['SchoolMember', sr.SchoolMember],
  ];
  for (const [name, entity] of emailKeyed) {
    try {
      const r = await entity.updateMany({ user_email: userEmail }, { $set: { username: newUsername } });
      results[name] = r?.modified_count ?? 0;
    } catch (e) {
      results[name] = -1;
    }
  }

  // Entities keyed by `author_email` with an `author_username` field
  const authorKeyed = [
    ['ForumPost', sr.ForumPost],
    ['ForumComment', sr.ForumComment],
  ];
  for (const [name, entity] of authorKeyed) {
    try {
      const r = await entity.updateMany({ author_email: userEmail }, { $set: { author_username: newUsername } });
      results[name] = r?.modified_count ?? 0;
    } catch (e) {
      results[name] = -1;
    }
  }

  return results;
}