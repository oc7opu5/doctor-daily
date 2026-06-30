const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('dd_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// Auth
export const login = (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const register = (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const getMe = () => request('/auth/me');

// Diary
export const listDiary = () => request('/diary');
export const createDiary = (data) => request('/diary', { method: 'POST', body: JSON.stringify(data) });
export const getDiary = (id) => request(`/diary/${id}`);
export const updateDiary = (id, data) => request(`/diary/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDiary = (id) => request(`/diary/${id}`, { method: 'DELETE' });
export const organizeDiary = (id) => request(`/diary/${id}/organize`, { method: 'POST' });
export const selectDiaryVersion = (id, versionIndex) => request(`/diary/${id}/select-version`, { method: 'POST', body: JSON.stringify({ version_index: versionIndex }) });
export const extractDiaryTransactions = (id) => request(`/diary/${id}/extract-transactions`, { method: 'POST' });

// Finance
export const listTransactions = () => request('/finance');
export const createTransaction = (data) => request('/finance', { method: 'POST', body: JSON.stringify(data) });
export const updateTransaction = (id, data) => request(`/finance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTransaction = (id) => request(`/finance/${id}`, { method: 'DELETE' });
export const getFinanceSummary = () => request('/finance/summary');
export const analyzeFinance = () => request('/finance/analyze', { method: 'POST' });
export const askFinanceAdvice = (question) => request(`/finance/advice?question=${encodeURIComponent(question)}`, { method: 'POST' });

// Settings
export const getSettings = () => request('/settings');
export const updateSettings = (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) });
export const listProviders = () => request('/settings/providers');
