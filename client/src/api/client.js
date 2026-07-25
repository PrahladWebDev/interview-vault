import axios from 'axios';

// In-memory access token. Deliberately NOT persisted to localStorage so an
// XSS payload can't read it off disk; the refresh token lives in an httpOnly
// cookie the browser sends automatically.
let accessToken = null;
let onUnauthorized = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send the refresh cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshPromise = null;

// Shared by the 401 interceptor below and by AuthContext's initial session
// restore. The refresh endpoint rotates the refresh token (old one is
// invalidated as soon as it's used), so if two callers fire a refresh at
// nearly the same time — e.g. React StrictMode double-invoking an effect on
// mount — the second call would get rejected because the first already
// rotated the cookie out from under it, logging the user straight back out.
// Deduping to a single in-flight request avoids that race entirely.
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api.post('/auth/refresh').finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retry && config.url !== '/auth/refresh') {
      config._retry = true;
      try {
        const { data } = await refreshSession();
        setAccessToken(data.accessToken);
        config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(config);
      } catch (refreshError) {
        setAccessToken(null);
        onUnauthorized();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);