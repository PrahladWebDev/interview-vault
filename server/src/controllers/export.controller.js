import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Question, { DIFFICULTIES, EXPERIENCE_LEVELS, ROUNDS, LANGUAGES } from '../models/Question.js';
import Collection from '../models/Collection.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordActivity } from '../utils/activity.js';
import { buildJSONExport, buildMarkdownExport, toExportObject } from '../utils/exportFormat.js';

const FORMATS = new Set(['json', 'markdown', 'pdf']);

function slugifyFilename(name) {
  return (name || 'export')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'export';
}

// Streams a simple, readable PDF: one section per question. Kept
// intentionally plain (no exotic layout) since this is a data export, not a
// design deliverable.
function streamQuestionsPDF(res, questions, { title, filename }) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

  const doc = new PDFDocument({ margin: 50, bufferPages: true });
  doc.pipe(res);

  doc.fontSize(20).fillColor('#111').text(title, { align: 'left' });
  doc
    .fontSize(9)
    .fillColor('#666')
    .text(`Exported ${new Date().toLocaleString()} · ${questions.length} question(s)`);
  doc.moveDown(1.5);

  questions.forEach((raw, idx) => {
    const q = toExportObject(raw);

    if (idx > 0) doc.addPage();

    doc.fontSize(16).fillColor('#111').text(q.title || 'Untitled question');
    doc.moveDown(0.3);

    const meta = [
      q.company && `Company: ${q.company}`,
      q.topic && `Topic: ${q.topic}`,
      q.difficulty && `Difficulty: ${q.difficulty}`,
      q.experienceLevel && `Level: ${q.experienceLevel}`,
      q.round && `Round: ${q.round}`,
      `Status: ${q.solved ? 'Solved' : 'Pending'}`,
    ].filter(Boolean);
    doc.fontSize(10).fillColor('#555').text(meta.join('   ·   '));
    if (q.tags?.length) doc.fontSize(10).fillColor('#555').text(`Tags: ${q.tags.join(', ')}`);
    doc.moveDown(0.8);

    if (q.description) {
      doc.fontSize(12).fillColor('#111').text('Description', { underline: true });
      doc.fontSize(10).fillColor('#222').text(q.description);
      doc.moveDown(0.6);
    }

    if (q.codeExamples?.length) {
      doc.fontSize(12).fillColor('#111').text('Code', { underline: true });
      for (const ex of q.codeExamples) {
        if (!ex?.code) continue;
        doc.fontSize(9).fillColor('#666').text(`[${ex.language}]`);
        doc.font('Courier').fontSize(9).fillColor('#111').text(ex.code);
        doc.font('Helvetica');
        doc.moveDown(0.4);
      }
      doc.moveDown(0.4);
    }

    const exp = q.explanation || {};
    if (Object.values(exp).some(Boolean)) {
      doc.fontSize(12).fillColor('#111').text('Explanation', { underline: true });
      if (exp.detailed) doc.fontSize(10).fillColor('#222').text(exp.detailed);
      if (exp.timeComplexity) doc.fontSize(10).fillColor('#222').text(`Time complexity: ${exp.timeComplexity}`);
      if (exp.spaceComplexity) doc.fontSize(10).fillColor('#222').text(`Space complexity: ${exp.spaceComplexity}`);
      if (exp.edgeCases) doc.fontSize(10).fillColor('#222').text(`Edge cases: ${exp.edgeCases}`);
      if (exp.commonMistakes) doc.fontSize(10).fillColor('#222').text(`Common mistakes: ${exp.commonMistakes}`);
      if (exp.interviewTips) doc.fontSize(10).fillColor('#222').text(`Interview tips: ${exp.interviewTips}`);
      if (exp.alternativeSolutions) doc.fontSize(10).fillColor('#222').text(`Alternatives: ${exp.alternativeSolutions}`);
      doc.moveDown(0.6);
    }

    if (q.notes) {
      doc.fontSize(12).fillColor('#111').text('Notes', { underline: true });
      doc.fontSize(10).fillColor('#222').text(q.notes);
    }
  });

  doc.end();
}

function respondInFormat(res, { format, questions, title, filename }) {
  if (format === 'markdown') {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.md"`);
    return res.send(buildMarkdownExport(questions, { title }));
  }
  if (format === 'pdf') {
    return streamQuestionsPDF(res, questions, { title, filename });
  }
  // default: json
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
  return res.json(buildJSONExport(questions, { title }));
}

// GET /api/export/questions?format=json|markdown|pdf&ids=a,b,c
// Exports either a specific set of the user's questions (ids param) or all
// of them (no ids param) - always scoped to the requesting user.
export const exportQuestions = asyncHandler(async (req, res) => {
  const format = FORMATS.has(req.query.format) ? req.query.format : 'json';

  const filter = { owner: req.user._id };
  if (req.query.ids) {
    const ids = String(req.query.ids)
      .split(',')
      .map((s) => s.trim())
      .filter((id) => mongoose.isValidObjectId(id));
    if (ids.length === 0) throw ApiError.badRequest('No valid ids provided');
    filter._id = { $in: ids };
  }

  const questions = await Question.find(filter).sort({ createdAt: -1 });
  if (questions.length === 0) throw ApiError.notFound('No questions to export');

  respondInFormat(res, {
    format,
    questions,
    title: 'InterviewVault Export',
    filename: 'interviewvault-questions',
  });
});

// GET /api/export/collections/:id?format=json|markdown|pdf
export const exportCollection = asyncHandler(async (req, res) => {
  const format = FORMATS.has(req.query.format) ? req.query.format : 'json';

  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id }).populate('questions');
  if (!collection) throw ApiError.notFound('Collection not found');

  respondInFormat(res, {
    format,
    questions: collection.questions,
    title: collection.name,
    filename: `interviewvault-${slugifyFilename(collection.name)}`,
  });
});

// --- Import ----------------------------------------------------------------

const IMPORTABLE_FIELDS = [
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
  'solved',
  'personalRating',
  'codeExamples',
  'explanation',
  'resources',
  'notes',
];

function sanitizeImportedQuestion(raw) {
  const clean = {};
  for (const field of IMPORTABLE_FIELDS) {
    if (raw[field] !== undefined) clean[field] = raw[field];
  }
  if (!clean.title || typeof clean.title !== 'string' || !clean.title.trim()) return null;

  if (clean.difficulty && !DIFFICULTIES.includes(clean.difficulty)) delete clean.difficulty;
  if (clean.experienceLevel && !EXPERIENCE_LEVELS.includes(clean.experienceLevel)) delete clean.experienceLevel;
  if (clean.round && !ROUNDS.includes(clean.round)) delete clean.round;
  if (Array.isArray(clean.codeExamples)) {
    clean.codeExamples = clean.codeExamples.filter((ex) => ex && LANGUAGES.includes(ex.language));
  }
  return clean;
}

// POST /api/import/questions  { questions: [ ...exported question objects ] }
// Only JSON is supported for import (Markdown/PDF exports are for reading,
// not reliable round-tripping). Imported questions are always created fresh
// under the importing user - ids, owner, timestamps, and revision state from
// the source file are ignored.
export const importQuestions = asyncHandler(async (req, res) => {
  const incoming = req.body.questions;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    throw ApiError.badRequest('Expected a "questions" array to import');
  }
  if (incoming.length > 500) {
    throw ApiError.badRequest('Cannot import more than 500 questions at once');
  }

  const toCreate = [];
  let skipped = 0;
  for (const raw of incoming) {
    const clean = sanitizeImportedQuestion(raw || {});
    if (!clean) {
      skipped += 1;
      continue;
    }
    toCreate.push({ ...clean, owner: req.user._id });
  }

  if (toCreate.length === 0) throw ApiError.badRequest('No valid questions found in the import file');

  const created = await Question.insertMany(toCreate);
  await recordActivity(req.user._id, { type: 'imported', count: created.length });

  res.status(201).json({
    success: true,
    imported: created.length,
    skipped,
    questions: created,
  });
});
