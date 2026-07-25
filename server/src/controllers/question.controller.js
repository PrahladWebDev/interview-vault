import Question, { REVISION_INTERVALS_DAYS } from '../models/Question.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordActivity } from '../utils/activity.js';

const SORTABLE_FIELDS = new Set(['createdAt', 'updatedAt', 'title', 'difficulty', 'personalRating']);

function buildFilterQuery(ownerId, query) {
  const filter = { owner: ownerId };

  if (query.difficulty) filter.difficulty = { $in: [].concat(query.difficulty) };
  if (query.company) filter.company = { $in: [].concat(query.company) };
  if (query.topic) filter.topic = { $in: [].concat(query.topic) };
  if (query.tags) filter.tags = { $in: [].concat(query.tags) };
  if (query.language) filter['codeExamples.language'] = { $in: [].concat(query.language) };

  if (query.favorite !== undefined) filter.favorite = query.favorite === 'true';
  if (query.status === 'solved') filter.solved = true;
  if (query.status === 'pending') filter.solved = false;
  if (query.status === 'revisionDue') filter['revision.nextRevisionDate'] = { $lte: new Date() };

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
}

export const listQuestions = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const sortField = SORTABLE_FIELDS.has(req.query.sortBy) ? req.query.sortBy : 'createdAt';
  const sortDir = req.query.sortDir === 'asc' ? 1 : -1;

  const filter = buildFilterQuery(req.user._id, req.query);

  const [items, total] = await Promise.all([
    Question.find(filter)
      .sort({ [sortField]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-notes -theoryAnswer -explanation -resources -codeExamples.code'),
    Question.countDocuments(filter),
  ]);

  res.json({
    success: true,
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasMore: page * limit < total,
    },
  });
});

export const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findOne({ _id: req.params.id, owner: req.user._id });
  if (!question) throw ApiError.notFound('Question not found');
  res.json({ success: true, question });
});

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await Question.create({ ...req.body, owner: req.user._id });
  await recordActivity(req.user._id, { type: 'added', question });
  res.status(201).json({ success: true, question });
});

const EDITABLE_FIELDS = [
  'title',
  'description',
  'company',
  'experienceLevel',
  'round',
  'difficulty',
  'topic',
  'subtopic',
  'tags',
  'favorite',
  'personalRating',
  'codeExamples',
  'explanation',
  'resources',
  'notes',
  'theoryAnswer',
];

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findOne({ _id: req.params.id, owner: req.user._id });
  if (!question) throw ApiError.notFound('Question not found');

  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) question[field] = req.body[field];
  }

  await question.save();
  await recordActivity(req.user._id, { type: 'updated', question });
  res.json({ success: true, question });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!question) throw ApiError.notFound('Question not found');
  res.json({ success: true, message: 'Question deleted' });
});

export const toggleFavorite = asyncHandler(async (req, res) => {
  const question = await Question.findOne({ _id: req.params.id, owner: req.user._id });
  if (!question) throw ApiError.notFound('Question not found');

  question.favorite = !question.favorite;
  await question.save();
  res.json({ success: true, question });
});

export const markSolved = asyncHandler(async (req, res) => {
  const question = await Question.findOne({ _id: req.params.id, owner: req.user._id });
  if (!question) throw ApiError.notFound('Question not found');

  question.solved = req.body.solved !== undefined ? Boolean(req.body.solved) : true;
  question.solvedAt = question.solved ? new Date() : null;

  if (question.solved && question.revision.status === 'new') {
    question.revision.stage = 0;
    question.revision.status = 'learning';
    question.revision.lastReviewedAt = new Date();
    const next = new Date();
    next.setDate(next.getDate() + REVISION_INTERVALS_DAYS[0]);
    question.revision.nextRevisionDate = next;
  }

  await question.save();
  if (question.solved) await recordActivity(req.user._id, { type: 'solved', question });
  res.json({ success: true, question });
});

// Advances the spaced-repetition schedule for a question that has just been reviewed.
export const reviewQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findOne({ _id: req.params.id, owner: req.user._id });
  if (!question) throw ApiError.notFound('Question not found');

  const { remembered = true } = req.body;
  const maxStage = REVISION_INTERVALS_DAYS.length - 1;

  question.revision.stage = remembered
    ? Math.min(question.revision.stage + 1, maxStage)
    : Math.max(question.revision.stage - 1, 0);

  question.revision.lastReviewedAt = new Date();

  if (remembered && question.revision.stage === maxStage) {
    question.revision.status = 'mastered';
    question.revision.nextRevisionDate = null;
  } else {
    question.revision.status = 'learning';
    const next = new Date();
    next.setDate(next.getDate() + REVISION_INTERVALS_DAYS[question.revision.stage]);
    question.revision.nextRevisionDate = next;
  }

  await question.save();
  await recordActivity(req.user._id, { type: 'reviewed', question, remembered });
  res.json({ success: true, question });
});

export const getFacets = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  const [companies, topics, tags] = await Promise.all([
    Question.distinct('company', { owner, company: { $ne: '' } }),
    Question.distinct('topic', { owner, topic: { $ne: '' } }),
    Question.distinct('tags', { owner }),
  ]);
  res.json({ success: true, companies, topics, tags });
});