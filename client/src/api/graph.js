import { api } from './client.js';

export async function fetchGraph() {
  const { data } = await api.get('/graph');
  return data;
}
