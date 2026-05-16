const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      'Cannot reach the server. If this is Railway, wait for deploy to finish or check Deploy logs.'
    );
  }

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        res.ok ? 'Invalid server response' : `Server error (${res.status}). Check Railway deploy logs.`
      );
    }
  }

  if (!res.ok) {
    const message =
      data.error ||
      data.errors?.[0]?.msg ||
      (Array.isArray(data.errors) && data.errors[0]?.message) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export const authApi = {
  signup: (body) => api('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => api('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
};

export const projectsApi = {
  list: () => api('/projects'),
  get: (id) => api(`/projects/${id}`),
  create: (body) => api('/projects', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => api(`/projects/${id}`, { method: 'DELETE' }),
  addMember: (id, body) =>
    api(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(body) }),
  updateMember: (id, userId, body) =>
    api(`/projects/${id}/members/${userId}`, { method: 'PUT', body: JSON.stringify(body) }),
  removeMember: (id, userId) => api(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),
};

export const tasksApi = {
  list: (projectId, params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v != null)
    );
    const qs = new URLSearchParams(clean).toString();
    return api(`/tasks/projects/${projectId}/tasks${qs ? `?${qs}` : ''}`);
  },
  create: (projectId, body) =>
    api(`/tasks/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateStatus: (id, status) =>
    api(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  remove: (id) => api(`/tasks/${id}`, { method: 'DELETE' }),
};

export const notificationsApi = {
  list: (unreadOnly = false) =>
    api(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`),
  markRead: (id) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => api('/notifications/read-all', { method: 'PATCH' }),
  getSettings: () => api('/notifications/settings'),
  updateSettings: (body) =>
    api('/notifications/settings', { method: 'PUT', body: JSON.stringify(body) }),
  getVapidKey: () => api('/notifications/vapid-public-key'),
  subscribe: (body) =>
    api('/notifications/subscribe', { method: 'POST', body: JSON.stringify(body) }),
};

export const dashboardApi = {
  get: () => api('/dashboard'),
};
