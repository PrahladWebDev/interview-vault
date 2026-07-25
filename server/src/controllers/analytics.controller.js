import Question from '../models/Question.js';
import Activity from '../models/Activity.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Buckets a date field into ISO week ("2026-W07") or calendar month ("2026-07")
// labels for time-series aggregation.
function periodExpr(field, period) {
  if (period === 'month') {
    return { $dateToString: { format: '%Y-%m', date: field } };
  }
  return {
    $concat: [
      { $toString: { $isoWeekYear: field } },
      '-W',
      { $cond: [{ $lt: [{ $isoWeek: field }, 10] }, '0', ''] },
      { $toString: { $isoWeek: field } },
    ],
  };
}

export const getAnalytics = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  const period = req.query.period === 'month' ? 'month' : 'week';
  const since = new Date();
  since.setDate(since.getDate() - (period === 'month' ? 365 : 84));

  const [addedSeries, solvedSeries, difficultyBreakdown, reviewEvents, solveDurations] = await Promise.all([
    Question.aggregate([
      { $match: { owner, createdAt: { $gte: since } } },
      { $group: { _id: periodExpr('$createdAt', period), added: { $sum: 1 } } },
    ]),
    Question.aggregate([
      { $match: { owner, solved: true, solvedAt: { $gte: since } } },
      { $group: { _id: periodExpr('$solvedAt', period), solved: { $sum: 1 } } },
    ]),
    Question.aggregate([
      { $match: { owner } },
      {
        $group: {
          _id: '$difficulty',
          total: { $sum: 1 },
          solved: { $sum: { $cond: ['$solved', 1, 0] } },
        },
      },
    ]),
    Activity.aggregate([
      { $match: { owner, date: { $gte: since.toISOString().slice(0, 10) } } },
      { $unwind: '$events' },
      { $match: { 'events.type': 'reviewed' } },
      {
        $group: {
          _id: '$date',
          total: { $sum: 1 },
          remembered: { $sum: { $cond: ['$events.remembered', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Proxy for "solving time": days between adding a question and marking it
    // solved. The schema has no active-timer field, so this is time-to-solve,
    // not hands-on-keyboard duration — labeled as such in the response.
    Question.aggregate([
      { $match: { owner, solved: true, solvedAt: { $ne: null } } },
      {
        $project: {
          difficulty: 1,
          days: { $divide: [{ $subtract: ['$solvedAt', '$createdAt'] }, 1000 * 60 * 60 * 24] },
        },
      },
      { $group: { _id: '$difficulty', avgDays: { $avg: '$days' }, count: { $sum: 1 } } },
    ]),
  ]);

  // Merge added/solved series into one timeline keyed by period label.
  const timelineMap = new Map();
  for (const row of addedSeries) timelineMap.set(row._id, { period: row._id, added: row.added, solved: 0 });
  for (const row of solvedSeries) {
    const existing = timelineMap.get(row._id) || { period: row._id, added: 0, solved: 0 };
    existing.solved = row.solved;
    timelineMap.set(row._id, existing);
  }
  const solveRateTimeline = Array.from(timelineMap.values()).sort((a, b) => a.period.localeCompare(b.period));

  const reviewTotals = reviewEvents.reduce(
    (acc, r) => ({ total: acc.total + r.total, remembered: acc.remembered + r.remembered }),
    { total: 0, remembered: 0 }
  );

  res.json({
    success: true,
    period,
    solveRateTimeline,
    difficultyBreakdown: difficultyBreakdown.map((d) => ({ difficulty: d._id, total: d.total, solved: d.solved })),
    revisionAccuracy: {
      overall: reviewTotals.total ? Math.round((reviewTotals.remembered / reviewTotals.total) * 100) : null,
      totalReviews: reviewTotals.total,
      timeline: reviewEvents.map((r) => ({
        date: r._id,
        total: r.total,
        remembered: r.remembered,
        pct: Math.round((r.remembered / r.total) * 100),
      })),
    },
    avgTimeToSolveDays: {
      note: 'Days from adding a question to marking it solved — the app does not track active solving-session duration.',
      byDifficulty: solveDurations.map((d) => ({
        difficulty: d._id,
        avgDays: Math.round((d.avgDays || 0) * 10) / 10,
        count: d.count,
      })),
    },
  });
});
