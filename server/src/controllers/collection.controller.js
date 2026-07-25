import mongoose from 'mongoose';
import Collection from '../models/Collection.js';
import Question from '../models/Question.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const QUESTION_PREVIEW_FIELDS = 'title difficulty company topic solved favorite';

export const listCollections = asyncHandler(async (req, res) => {
  const owner = req.user._id;

  const collections = await Collection.aggregate([
    { $match: { owner } },
    {
      $project: {
        name: 1,
        description: 1,
        color: 1,
        createdAt: 1,
        updatedAt: 1,
        questionCount: { $size: '$questions' },
      },
    },
    { $sort: { updatedAt: -1 } },
  ]);

  res.json({ success: true, collections });
});

export const createCollection = asyncHandler(async (req, res) => {
  const { name, description = '', color } = req.body;

  const exists = await Collection.findOne({ owner: req.user._id, name });
  if (exists) throw ApiError.conflict('A collection with that name already exists');

  const collection = await Collection.create({
    owner: req.user._id,
    name,
    description,
    ...(color ? { color } : {}),
  });

  res.status(201).json({ success: true, collection });
});

export const getCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id }).populate(
    'questions',
    QUESTION_PREVIEW_FIELDS
  );
  if (!collection) throw ApiError.notFound('Collection not found');
  res.json({ success: true, collection });
});

export const updateCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
  if (!collection) throw ApiError.notFound('Collection not found');

  if (req.body.name !== undefined) {
    const clash = await Collection.findOne({
      owner: req.user._id,
      name: req.body.name,
      _id: { $ne: collection._id },
    });
    if (clash) throw ApiError.conflict('A collection with that name already exists');
    collection.name = req.body.name;
  }
  if (req.body.description !== undefined) collection.description = req.body.description;
  if (req.body.color !== undefined) collection.color = req.body.color;

  await collection.save();
  res.json({ success: true, collection });
});

export const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!collection) throw ApiError.notFound('Collection not found');
  res.json({ success: true, message: 'Collection deleted' });
});

// Adds one or more questions to a collection. Owner is verified on both the
// collection and every question id to prevent cross-account linking.
export const addQuestionsToCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
  if (!collection) throw ApiError.notFound('Collection not found');

  const questionIds = [].concat(req.body.questionIds || []).filter((id) => mongoose.isValidObjectId(id));
  if (questionIds.length === 0) throw ApiError.badRequest('questionIds is required');

  const owned = await Question.find({ _id: { $in: questionIds }, owner: req.user._id }).select('_id');
  const ownedIds = new Set(owned.map((q) => q._id.toString()));

  const existing = new Set(collection.questions.map((id) => id.toString()));
  for (const id of questionIds) {
    if (ownedIds.has(id) && !existing.has(id)) {
      collection.questions.push(id);
      existing.add(id);
    }
  }

  await collection.save();
  await collection.populate('questions', QUESTION_PREVIEW_FIELDS);
  res.json({ success: true, collection });
});

export const removeQuestionFromCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
  if (!collection) throw ApiError.notFound('Collection not found');

  collection.questions = collection.questions.filter((id) => id.toString() !== req.params.questionId);
  await collection.save();
  await collection.populate('questions', QUESTION_PREVIEW_FIELDS);
  res.json({ success: true, collection });
});

// Persists a new question order within a collection (drag & drop on the
// client). Body is the full ordered list of question ids; it must be exactly
// the same set of ids the collection already has, just reordered.
export const reorderCollectionQuestions = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
  if (!collection) throw ApiError.notFound('Collection not found');

  const newOrder = [].concat(req.body.questionIds || []).filter((id) => mongoose.isValidObjectId(id));
  const current = collection.questions.map((id) => id.toString());

  const sameSet =
    newOrder.length === current.length &&
    new Set(newOrder).size === current.length &&
    current.every((id) => newOrder.includes(id));

  if (!sameSet) {
    throw ApiError.badRequest('questionIds must be a reordering of the collection\'s existing questions');
  }

  collection.questions = newOrder;
  await collection.save();
  await collection.populate('questions', QUESTION_PREVIEW_FIELDS);
  res.json({ success: true, collection });
});

// Returns every collection with a flag for whether it already contains the
// given question — powers the "add to collections" checklist on a question.
export const getCollectionsForQuestion = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  const { questionId } = req.params;

  const collections = await Collection.find({ owner }).select('name color questions');

  res.json({
    success: true,
    collections: collections.map((c) => ({
      _id: c._id,
      name: c.name,
      color: c.color,
      included: c.questions.some((id) => id.toString() === questionId),
    })),
  });
});
