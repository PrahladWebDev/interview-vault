import { api } from './client.js';

export async function explainCodeRequest(questionId, language) {
  const { data } = await api.post(`/ai/explain-code/${questionId}`, { language });
  return data;
}

export async function suggestSimilarQuestionsRequest(questionId) {
  const { data } = await api.post(`/ai/similar-questions/${questionId}`);
  return data.questions;
}

export async function mockInterviewMessageRequest(questionId, history, message) {
  const { data } = await api.post(`/ai/interview/${questionId}`, { history, message });
  return data.reply;
}

export async function generateQuizRequest({ topic, company, difficulty, count } = {}) {
  const { data } = await api.post('/ai/quiz', { topic, company, difficulty, count });
  return data.quiz;
}

export async function summarizeNotesRequest(questionId) {
  const { data } = await api.post(`/ai/summarize-notes/${questionId}`);
  return data.summary;
}
