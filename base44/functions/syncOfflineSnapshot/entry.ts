import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const CAPS = {
  UserLibrary: 200,
  ReadingLog: 150,
  Review: 50,
  VaultEntry: 50,
  ChatMessage: 100,
  BookClubMember: 50,
  ReadingClub: 50,
};

function compact(record) {
  const out = {};
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (value !== undefined && value !== null) out[key] = value;
  }
  return out;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const email = user.email;

    const [library, logs, goals, reviews, vault, prefs, profile, memberships, chat] = await Promise.all([
      base44.entities.UserLibrary.filter({ user_email: email }).catch(() => []),
      base44.entities.ReadingLog.filter({ user_email: email }).catch(() => []),
      base44.entities.ReadingGoal.filter({ user_email: email }).catch(() => []),
      base44.entities.Review.filter({ user_email: email }).catch(() => []),
      base44.entities.VaultEntry.filter({ user_email: email }).catch(() => []),
      base44.entities.UserPreferences.filter({ user_email: email }).catch(() => []),
      base44.entities.UserProfile.filter({ user_email: email }).catch(() => []),
      base44.entities.BookClubMember.filter({ user_email: email }).catch(() => []),
      base44.entities.ChatMessage.filter({ user_email: email }).catch(() => [])
    ]);

    const clubIds = [...new Set(memberships.map(m => m.club_id).filter(Boolean))].slice(0, CAPS.ReadingClub);
    const clubs = (await Promise.all(
      clubIds.map(id => base44.entities.ReadingClub.get(id).catch(() => null))
    )).filter(Boolean);

    const snapshot = {
      UserLibrary: library.slice(0, CAPS.UserLibrary).map(compact),
      ReadingLog: logs.slice(0, CAPS.ReadingLog).map(compact),
      ReadingGoal: goals.map(compact),
      Review: reviews.slice(0, CAPS.Review).map(compact),
      VaultEntry: vault.slice(0, CAPS.VaultEntry).map(compact),
      UserPreferences: prefs.map(compact),
      UserProfile: profile.map(compact),
      BookClubMember: memberships.slice(0, CAPS.BookClubMember).map(compact),
      ReadingClub: clubs.map(compact),
      ChatMessage: chat.slice(0, CAPS.ChatMessage).map(compact)
    };

    const snapshotJson = JSON.stringify(snapshot);

    // The snapshot JSON can exceed a single entity field's size limit, so
    // store it in chunks across multiple records owned by the user.
    const CHUNK_SIZE = 8000;
    const parts = [];
    for (let i = 0; i < snapshotJson.length; i += CHUNK_SIZE) {
      parts.push({
        user_email: email,
        user_id: user.id,
        part_index: Math.floor(i / CHUNK_SIZE),
        total_parts: Math.ceil(snapshotJson.length / CHUNK_SIZE),
        snapshot_chunk: snapshotJson.slice(i, i + CHUNK_SIZE)
      });
    }

    // Write the new snapshot chunks first, then delete the old chunks —
    // so the user is never left without a snapshot if the write fails.
    const existing = await base44.entities.OfflineSnapshot.filter({ user_email: email });
    let created = [];
    if (parts.length > 0) {
      created = await base44.entities.OfflineSnapshot.bulkCreate(parts);
    }
    const newIds = new Set(created.map(r => r.id));
    for (const old of existing) {
      if (!newIds.has(old.id)) {
        await base44.entities.OfflineSnapshot.delete(old.id).catch(() => {});
      }
    }

    return Response.json({
      user_email: email,
      user_id: user.id,
      synced_at: new Date().toISOString(),
      counts: Object.fromEntries(Object.entries(snapshot).map(([k, v]) => [k, v.length])),
      snapshot
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}