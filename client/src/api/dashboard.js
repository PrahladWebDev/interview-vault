import { api } from './client.js';

export async function fetchSummary() {
  const { data } = await api.get('/dashboard/summary');
  return data.summary;
}

export async function fetchHeatmap(days = 365) {
  const { data } = await api.get('/dashboard/heatmap', { params: { days } });
  return data.heatmap;
}

export async function fetchTopicProgress() {
  const { data } = await api.get('/dashboard/topics');
  return data.topics;
}

export async function fetchCompanyProgress() {
  const { data } = await api.get('/dashboard/companies');
  return data.companies;
}

export async function fetchRecentActivity(limit = 15) {
  const { data } = await api.get('/dashboard/activity', { params: { limit } });
  return data.activity;
}
