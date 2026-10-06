import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8088';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const authService = {
  getSetupStatus: () => api.get('/api/auth/setup-status/'),
  setupAdmin: (data) => api.post('/api/auth/setup-admin/', data),
  login: (username, password) => api.post('/api/auth/login/', { username, password }),
  logout: () => api.post('/api/auth/logout/'),
  me: () => api.get('/api/auth/me/'),
};

export const businessService = {
  list: () => api.get('/api/businesses/'),
  get: (id) => api.get(`/api/businesses/${id}/`),
  create: (data) => api.post('/api/businesses/', data),
  update: (id, data) => api.patch(`/api/businesses/${id}/`, data),
  getPublic: (slug) => api.get(`/api/businesses/public/${slug}/`),
};

export const cardService = {
  list: (params) => api.get('/api/cards/', { params }),
  get: (id) => api.get(`/api/cards/${id}/`),
  create: (data) => api.post('/api/cards/', data),
  updateDestination: (id, destination_url) => api.post(`/api/cards/${id}/update-destination/`, { destination_url }),
  suspend: (id, data) => api.post(`/api/cards/${id}/suspend/`, data),
  deactivate: (id, data) => api.post(`/api/cards/${id}/deactivate/`, data),
  bulkGenerate: (data) => api.post('/api/cards/bulk-generate/', data),
  downloadQrUrl: (id, format = 'png') => `${API_BASE}/api/cards/${id}/download_qr/?format=${format}`,
  resolveDirect: (token, sessionToken) => api.get(`/q/${token}/`, {
    params: sessionToken ? { session_token: sessionToken } : {},
    headers: { Accept: 'application/json' }
  }),
};

export const activationSessionService = {
  start: () => api.post('/api/cards/activation-sessions/start/'),
  checkStatus: (id) => api.get(`/api/cards/activation-sessions/${id}/status/`),
  verifyScan: (id, card_id) => api.post(`/api/cards/activation-sessions/${id}/verify-scan/`, { card_id }),
  complete: (id, data) => api.post(`/api/cards/activation-sessions/${id}/complete/`, data),
};

export const menuService = {
  list: () => api.get('/api/menus/'),
  get: (id) => api.get(`/api/menus/${id}/`),
  create: (data) => api.post('/api/menus/', data),
  getPublic: (slug) => api.get(`/api/menus/public/${slug}/`),
  createCategory: (data) => api.post('/api/menus/categories/', data),
  createItem: (data) => api.post('/api/menus/items/', data),
  updateItem: (id, data) => api.patch(`/api/menus/items/${id}/`, data),
  deleteItem: (id) => api.delete(`/api/menus/items/${id}/`),
};

export const analyticsService = {
  getSummary: (params) => api.get('/api/analytics/summary/', { params }),
  getEvents: () => api.get('/api/analytics/events/'),
  trackEvent: (data) => api.post('/api/analytics/track/', data),
};

export const auditService = {
  getLogs: () => api.get('/api/audit/logs/'),
};

export default api;
