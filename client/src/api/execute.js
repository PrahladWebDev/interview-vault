import { api } from './client.js';

export async function runCodeRequest({ language, code, stdin = '' }) {
  const { data } = await api.post('/execute', { language, code, stdin });
  return data.result;
}
