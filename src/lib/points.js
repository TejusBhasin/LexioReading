import { base44 } from '@/api/base44Client';
import { showPointNotification } from '@/components/streak/PointNotification';

const MAX_DAILY = 19;
const POINTS = {
  log: 3,
  review: 5,
  chat: 1,
  book_complete: 10,
};

export async function awardPoints(userEmail, type, username = '') {
  const pts = POINTS[type];
  if (!pts) return;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await base44.entities.UserPoints.filter({ user_email: userEmail });
    const record = existing[0];

    const isSameDay = record?.daily_points_date === today;
    const currentDaily = isSameDay ? (record?.daily_points || 0) : 0;

    if (currentDaily >= MAX_DAILY) return; // hit daily cap

    const earned = Math.min(pts, MAX_DAILY - currentDaily);
    if (earned <= 0) return;

    const labels = { log: 'Session logged', review: 'Review written', chat: 'AI chat', book_complete: 'Book completed!' };
    showPointNotification(earned, labels[type]);

    if (record) {
      await base44.entities.UserPoints.update(record.id, {
        total_points: (record.total_points || 0) + earned,
        daily_points: currentDaily + earned,
        daily_points_date: today,
        username: username || record.username,
      });
    } else {
      await base44.entities.UserPoints.create({
        user_email: userEmail,
        username,
        total_points: earned,
        daily_points: earned,
        daily_points_date: today,
        streak_days: 0,
        streak_freeze_count: 0,
        leaderboard_opt_in: false,
      });
    }
  } catch (e) {}
}

export async function getOrCreatePoints(userEmail, username) {
  const existing = await base44.entities.UserPoints.filter({ user_email: userEmail });
  if (existing[0]) return existing[0];
  return base44.entities.UserPoints.create({
    user_email: userEmail,
    username,
    total_points: 0,
    daily_points: 0,
    streak_days: 0,
    streak_freeze_count: 0,
    leaderboard_opt_in: false,
  });
}