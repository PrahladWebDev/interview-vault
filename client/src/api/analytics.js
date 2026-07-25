import { api } from './client.js';

export async function fetchAnalytics(period = 'week') {
  const { data } = await api.get('/analytics', { params: { period } });
  return data;
}
