const BASE_URL = '/api/v1';

async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include', // Required for HttpOnly cookie BFF pattern
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    let message = error.detail || error.title || 'Request failed';
    if (error.errors && typeof error.errors === 'object') {
      const messages = Object.values(error.errors).flat().filter(Boolean);
      if (messages.length > 0) {
        message = messages.join('. ');
      }
    }
    throw Object.assign(new Error(message), {
      status: response.status,
      data: error,
    });
  }

  return response.json();
}

export const auth = {
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/auth/me'),
};

export const profile = {
  get: () => apiFetch('/profile/me'),
  upsert: (data) => apiFetch('/profile/me', { method: 'PUT', body: JSON.stringify(data) }),
  snapshot: () => apiFetch('/profile/me/consented-summary'),
  privacyAudit: () => apiFetch('/profile/privacy-audit'),
  exportFile: async () => {
    const res = await fetch(`${BASE_URL}/profile/me/export`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Export failed' }));
      throw new Error(err.detail || 'Failed to export Member 2 profile contract');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GradPath_Member2_ProfileSnapshot_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },
  uploadCv: (file) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${BASE_URL}/profile/me/cv`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    }).then(async (r) => {
      const data = await r.json().catch(() => ({ detail: 'Upload failed' }));
      if (!r.ok) {
        let msg = data.detail || data.title || 'Upload failed';
        if (data.errors && typeof data.errors === 'object') {
          const list = Object.values(data.errors).flat().filter(Boolean);
          if (list.length > 0) msg = list.join('. ');
        }
        throw new Error(msg);
      }
      return data;
    });
  },
};
