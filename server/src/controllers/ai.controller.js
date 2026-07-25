import Question from '../models/Question.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { generateContent, parseJsonResponse } from '../services/gemini.js';

async function loadOwnedQuestion(owner, id) {
  const question = await Question.findOne({ _id: id, owner });
  if (!question) throw ApiError.notFound('Question not found');
  return question;
}

// --- 1. Explain a saved solution -------------------------------------------------

export const explainCode = asyncHandler(async (req, res) => {
  const { language } = req.body;
  const question = await loadOwnedQuestion(req.user._id, req.params.id);

  const example = question.codeExamples.find((c) => c.language === language) || question.codeExamples[0];
  if (!example || !example.code?.trim()) {
    throw ApiError.badRequest('This question has no saved code to explain yet.');
  }

  const prompt = `You are helping a candidate prepare for technical interviews. Explain the following ${example.language} solution to the problem "${question.title}".

Problem description:
${question.description || '(no description saved)'}

Solution code:
\`\`\`${example.language}
${example.code}
\`\`\`

Respond in markdown with these sections, in order: **Approach**, **Why it works**, **Time complexity**, **Space complexity**, **Edge cases to watch for**. Be concise but concrete — reference actual variables or lines from the code where it helps.`;

  const { text } = await generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    temperature: 0.4,
  });

  res.json({ success: true, explanation: text, language: example.language });
});

// --- 2. Suggest similar / follow-up questions -----------------------------------

const similarQuestionsSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
          topic: { type: 'string' },
          whyRelated: { type: 'string' },
        },
        required: ['title', 'description', 'difficulty', 'whyRelated'],
      },
    },
  },
  required: ['questions'],
};

export const suggestSimilarQuestions = asyncHandler(async (req, res) => {
  const question = await loadOwnedQuestion(req.user._id, req.params.id);

  const prompt = `Given this interview question a candidate has already practiced:

Title: ${question.title}
Topic: ${question.topic || 'unspecified'}
Difficulty: ${question.difficulty}
Description: ${question.description || '(no description saved)'}

Suggest exactly 4 additional interview questions: 2 that test the same underlying concept from a different angle, and 2 natural follow-up/harder variants an interviewer might ask next in the same interview. For each, give a short title, a 1-3 sentence description, a difficulty, a topic (a short category like "Arrays" or "System Design"), and a one-sentence "whyRelated" note explaining the connection.`;

  const { text } = await generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    jsonSchema: similarQuestionsSchema,
    temperature: 0.8,
  });

  const parsed = parseJsonResponse(text);
  res.json({ success: true, questions: parsed.questions || [] });
});

// --- 3. Mock interviewer chat ----------------------------------------------------

export const mockInterviewMessage = asyncHandler(async (req, res) => {
  const { history = [], message } = req.body;
  const question = await loadOwnedQuestion(req.user._id, req.params.id);

  if (!message || typeof message !== 'string' || !message.trim()) {
    throw ApiError.badRequest('message is required');
  }
  if (!Array.isArray(history)) {
    throw ApiError.badRequest('history must be an array');
  }
  if (history.length > 40) {
    throw ApiError.badRequest('This conversation has gotten long — start a new mock interview.');
  }

  const systemInstruction = `You are a friendly but rigorous technical interviewer conducting a mock interview about this problem:

Title: ${question.title}
Difficulty: ${question.difficulty}
Description: ${question.description || '(no description saved)'}

Rules:
- Never reveal the full solution outright. Ask guiding questions, and only give a hint if the candidate seems stuck for multiple turns.
- Keep each response to a few sentences, like a real spoken interview.
- If the candidate proposes a correct approach, probe them on time/space complexity or an edge case before moving on.
- If they go off track, redirect them with a question rather than lecturing.
- Stay in character as the interviewer for the whole conversation. Open the very first message by briefly restating the problem and asking how they'd like to start.`;

  const contents = [
    ...history.slice(-40).map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(h.text || '').slice(0, 4000) }],
    })),
    { role: 'user', parts: [{ text: message.slice(0, 4000) }] },
  ];

  const { text } = await generateContent({ contents, systemInstruction, temperature: 0.7 });

  res.json({ success: true, reply: text });
});

// --- 4. Quiz generation -----------------------------------------------------------

const quizSchema = {
  type: 'object',
  properties: {
    quiz: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
          correctIndex: { type: 'integer' },
          explanation: { type: 'string' },
        },
        required: ['question', 'options', 'correctIndex', 'explanation'],
      },
    },
  },
  required: ['quiz'],
};

export const generateQuiz = asyncHandler(async (req, res) => {
  const { topic, company, difficulty, count = 5 } = req.body;
  const owner = req.user._id;
  const clampedCount = Math.min(Math.max(Number(count) || 5, 1), 10);

  const filter = { owner };
  if (topic) filter.topic = topic;
  if (company) filter.company = company;
  if (difficulty) filter.difficulty = difficulty;

  const sampleQuestions = await Question.find(filter).select('title topic difficulty').limit(15).lean();

  if (sampleQuestions.length === 0) {
    throw ApiError.badRequest('No saved questions match those filters — try a broader topic, company, or difficulty.');
  }

  const titles = sampleQuestions.map((q) => `- ${q.title} (${q.topic || 'general'}, ${q.difficulty})`).join('\n');

  const prompt = `Generate a ${clampedCount}-question multiple-choice quiz to help someone review for technical interviews, based on the concepts behind these questions they've been practicing:

${titles}

${difficulty ? `Target difficulty: ${difficulty}.` : ''}
Each quiz question should test conceptual understanding of the underlying topic (do not just ask them to restate a saved title). Each needs exactly 4 answer options with exactly one correct option, and a short explanation of why the correct answer is right.`;

  const { text } = await generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    jsonSchema: quizSchema,
    temperature: 0.7,
  });

  const parsed = parseJsonResponse(text);
  const quiz = (parsed.quiz || []).filter(
    (q) => Array.isArray(q.options) && q.options.length === 4 && q.correctIndex >= 0 && q.correctIndex < 4
  );

  res.json({ success: true, quiz });
});

// --- 5. Summarize notes ------------------------------------------------------------

export const summarizeNotes = asyncHandler(async (req, res) => {
  const question = await loadOwnedQuestion(req.user._id, req.params.id);

  if (!question.notes || !question.notes.trim()) {
    throw ApiError.badRequest('This question has no notes to summarize yet.');
  }

  const prompt = `Summarize the following personal interview-prep notes into a tight set of markdown bullet points (at most 8 bullets). Preserve concrete facts, gotchas, and any code snippets that matter. Do not invent information that isn't in the notes.

Notes:
${question.notes}`;

  const { text } = await generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    temperature: 0.3,
  });

  res.json({ success: true, summary: text });
});
