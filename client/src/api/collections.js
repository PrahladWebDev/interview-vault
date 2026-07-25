import { api } from './client.js';

export async function fetchCollections() {
  const { data } = await api.get('/collections');
  return data.collections;
}

export async function fetchCollection(id) {
  const { data } = await api.get(`/collections/${id}`);
  return data.collection;
}

export async function fetchCollectionsForQuestion(questionId) {
  const { data } = await api.get(`/collections/for-question/${questionId}`);
  return data.collections;
}

export async function createCollectionRequest(payload) {
  const { data } = await api.post('/collections', payload);
  return data.collection;
}

export async function updateCollectionRequest(id, payload) {
  const { data } = await api.patch(`/collections/${id}`, payload);
  return data.collection;
}

export async function deleteCollectionRequest(id) {
  await api.delete(`/collections/${id}`);
}

export async function addQuestionsToCollectionRequest(id, questionIds) {
  const { data } = await api.post(`/collections/${id}/questions`, { questionIds });
  return data.collection;
}

export async function removeQuestionFromCollectionRequest(id, questionId) {
  const { data } = await api.delete(`/collections/${id}/questions/${questionId}`);
  return data.collection;
}

export async function reorderCollectionQuestionsRequest(id, questionIds) {
  const { data } = await api.patch(`/collections/${id}/reorder`, { questionIds });
  return data.collection;
}
