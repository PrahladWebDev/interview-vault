import Question from '../models/Question.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function snippetAround(text, regex, radius = 40) {
  const match = regex.exec(text);
  if (!match) return '';
  const start = Math.max(0, match.index - radius);
  const end = Math.min(text.length, match.index + match[0].length + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

// Searches title, notes, tags, and saved code across the current user's
// questions. Uses a case-insensitive regex rather than the Mongo text index
// so it can reach into codeExamples.code, which isn't part of that index.
export const search = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  if (q.length < 2) {
    return res.json({ success: true, query: q, results: [] });
  }

  const regex = new RegExp(escapeRegex(q), 'i');

  const questions = await Question.find({
    owner,
    $or: [{ title: regex }, { notes: regex }, { theoryAnswer: regex }, { tags: regex }, { 'codeExamples.code': regex }],
  })
    .select('title company topic difficulty solved favorite tags notes theoryAnswer codeExamples')
    .limit(limit * 3); // over-fetch slightly since we rank/trim after tagging matches

  const results = questions
    .map((question) => {
      const matchedIn = [];
      let snippet = '';

      if (regex.test(question.title)) matchedIn.push('title');
      if (question.tags?.some((t) => regex.test(t))) matchedIn.push('tags');
      if (question.notes && regex.test(question.notes)) {
        matchedIn.push('notes');
        if (!snippet) snippet = snippetAround(question.notes, new RegExp(escapeRegex(q), 'i'));
      }
      if (question.theoryAnswer && regex.test(question.theoryAnswer)) {
        matchedIn.push('theoryAnswer');
        if (!snippet) snippet = snippetAround(question.theoryAnswer, new RegExp(escapeRegex(q), 'i'));
      }
      const codeMatch = question.codeExamples?.find((c) => regex.test(c.code || ''));
      if (codeMatch) {
        matchedIn.push('code');
        if (!snippet) snippet = snippetAround(codeMatch.code, new RegExp(escapeRegex(q), 'i'));
      }

      return {
        _id: question._id,
        title: question.title,
        company: question.company,
        topic: question.topic,
        difficulty: question.difficulty,
        solved: question.solved,
        favorite: question.favorite,
        matchedIn,
        snippet,
      };
    })
    .filter((r) => r.matchedIn.length > 0)
    .sort((a, b) => {
      // Title matches first, then tags, then notes/code.
      const rank = (r) => (r.matchedIn.includes('title') ? 0 : r.matchedIn.includes('tags') ? 1 : 2);
      return rank(a) - rank(b);
    })
    .slice(0, limit);

  res.json({ success: true, query: q, results });
});