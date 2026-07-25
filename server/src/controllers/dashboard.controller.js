import Question from '../models/Question.js';
import Activity from '../models/Activity.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getSummary = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [solved, pending, favorites, revisionDueToday] = await Promise.all([
    Question.countDocuments({ owner, solved: true }),
    Question.countDocuments({ owner, solved: false }),
    Question.countDocuments({ owner, favorite: true }),
    Question.countDocuments({
      owner,
      'revision.nextRevisionDate': { $lte: endOfToday },
      'revision.status': { $in: ['learning', 'due'] },
    }),
  ]);

  res.json({
    success: true,
    summary: {
      solved,
      pending,
      favorites,
      revisionDueToday,
      currentStreak: req.user.currentStreak,
      longestStreak: req.user.longestStreak,
    },
  });
});

export const getHeatmap = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  const days = Math.min(parseInt(req.query.days, 10) || 365, 365);

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceKey = since.toISOString().slice(0, 10);

  const rows = await Activity.find({ owner, date: { $gte: sinceKey } })
    .select('date count -_id')
    .sort({ date: 1 });

  res.json({ success: true, heatmap: rows });
});

export const getTopicProgress = asyncHandler(async (req, res) => {
  const owner = req.user._id;

  const rows = await Question.aggregate([
    { $match: { owner } },
    {
      $group: {
        _id: '$topic',
        total: { $sum: 1 },
        solved: { $sum: { $cond: ['$solved', 1, 0] } },
      },
    },
    { $match: { _id: { $ne: '' } } },
    { $sort: { total: -1 } },
    { $limit: 20 },
  ]);

  res.json({
    success: true,
    topics: rows.map((r) => ({ topic: r._id, total: r.total, solved: r.solved })),
  });
});

export const getCompanyProgress = asyncHandler(async (req, res) => {
  const owner = req.user._id;

  const rows = await Question.aggregate([
    { $match: { owner } },
    {
      $group: {
        _id: '$company',
        total: { $sum: 1 },
        solved: { $sum: { $cond: ['$solved', 1, 0] } },
        easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] } },
        hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'Hard'] }, 1, 0] } },
      },
    },
    { $match: { _id: { $ne: '' } } },
    { $sort: { total: -1 } },
    { $limit: 20 },
  ]);

  res.json({
    success: true,
    companies: rows.map((r) => ({
      company: r._id,
      total: r.total,
      solved: r.solved,
      difficulty: { easy: r.easy, medium: r.medium, hard: r.hard },
    })),
  });
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  const limit = Math.min(parseInt(req.query.limit, 10) || 15, 50);

  const rows = await Activity.find({ owner }).sort({ date: -1 }).limit(10);

  const events = rows
    .flatMap((r) => r.events.map((e) => ({ ...e.toObject(), date: r.date })))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);

  res.json({ success: true, activity: events });
});
