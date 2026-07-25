import { api, setAccessToken, refreshSession } from './client.js';

export async function registerRequest({ name, email, password }) {
  const { data } = await api.post('/auth/register', { name, email, password });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function loginRequest({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function refreshRequest() {
  const { data } = await refreshSession();
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logoutRequest() {
  await api.post('/auth/logout');
  setAccessToken(null);
}

export async function meRequest() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function updateProfileRequest(payload) {
  const { data } = await api.patch('/auth/me', payload);
  return data.user;
}

export async function fetchSessions() {
  const { data } = await api.get('/auth/sessions');
  return data.sessions;
}

export async function revokeSessionRequest(sessionId) {
  await api.delete(`/auth/sessions/${sessionId}`);
}

export async function revokeOtherSessionsRequest() {
  const { data } = await api.delete('/auth/sessions/other');
  return data.message;
}