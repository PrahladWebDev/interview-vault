import { api } from './client.js';

const EXTENSIONS = { json: 'json', markdown: 'md', pdf: 'pdf' };

// The API needs the in-memory access token on the Authorization header, so a
// plain <a href> download won't authenticate. Instead we fetch as a blob via
// axios (which attaches the token) and trigger the save ourselves.
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportQuestions({ format = 'json', ids } = {}) {
  const { data } = await api.get('/export/questions', {
    params: { format, ids: ids?.length ? ids.join(',') : undefined },
    responseType: 'blob',
  });
  triggerDownload(data, `interviewvault-questions.${EXTENSIONS[format]}`);
}

export async function exportCollection(collectionId, collectionName, { format = 'json' } = {}) {
  const { data } = await api.get(`/export/collections/${collectionId}`, {
    params: { format },
    responseType: 'blob',
  });
  const slug = (collectionName || 'collection').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  triggerDownload(data, `interviewvault-${slug || 'collection'}.${EXTENSIONS[format]}`);
}

// Reads a File (from an <input type="file"> or drop event), expects it to be
// the JSON shape produced by exportQuestions/exportCollection, and imports it.
export async function importQuestionsFromFile(file) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON. Import only supports JSON exports.');
  }

  const questions = Array.isArray(parsed) ? parsed : parsed.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('No questions found in that file.');
  }

  const { data } = await api.post('/import/questions', { questions });
  return data; // { success, imported, skipped, questions }
}
