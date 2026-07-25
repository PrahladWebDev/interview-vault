import Activity from '../models/Activity.js';
import User from '../models/User.js';

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysBetween(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b - a) / msPerDay);
}

// Records one activity event for the day and updates the user's streak.
export async function recordActivity(userId, { type, question, remembered = null }) {
  const key = todayKey();

  await Activity.findOneAndUpdate(
    { owner: userId, date: key },
    {
      $inc: { count: 1 },
      $push: { events: { type, question: question?._id, title: question?.title, remembered } },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date(key);
  if (!user.lastActivityDate) {
    user.currentStreak = 1;
  } else {
    const diff = daysBetween(new Date(todayKey(user.lastActivityDate)), today);
    if (diff === 0) {
      // already logged today, streak unchanged
    } else if (diff === 1) {
      user.currentStreak += 1;
    } else {
      user.currentStreak = 1;
    }
  }
  user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
  user.lastActivityDate = today;
  await user.save();
}

export { todayKey };
