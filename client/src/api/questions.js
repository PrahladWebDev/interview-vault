import { api } from './client.js';

export async function fetchQuestions(params) {
  const { data } = await api.get('/questions', { params });
  return data;
}

export async function fetchQuestion(id) {
  const { data } = await api.get(`/questions/${id}`);
  return data.question;
}

export async function fetchFacets() {
  const { data } = await api.get('/questions/facets');
  return data;
}

export async function createQuestionRequest(payload) {
  const { data } = await api.post('/questions', payload);
  return data.question;
}

export async function updateQuestionRequest(id, payload) {
  const { data } = await api.patch(`/questions/${id}`, payload);
  return data.question;
}

export async function deleteQuestionRequest(id) {
  await api.delete(`/questions/${id}`);
}

export async function toggleFavoriteRequest(id) {
  const { data } = await api.post(`/questions/${id}/favorite`);
  return data.question;
}

export async function markSolvedRequest(id, solved = true) {
  const { data } = await api.post(`/questions/${id}/solve`, { solved });
  return data.question;
}

export async function reviewQuestionRequest(id, remembered = true) {
  const { data } = await api.post(`/questions/${id}/review`, { remembered });
  return data.question;
}
