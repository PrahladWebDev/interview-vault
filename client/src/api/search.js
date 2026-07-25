import { api } from './client.js';

export async function searchQuestions(q) {
  const { data } = await api.get('/search', { params: { q } });
  return data.results;
}
