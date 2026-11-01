const BASE_URL = '/api/v1';

async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include', // Required for HttpOnly cookie BFF pattern
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw Object.assign(new Error(error.detail || error.title || 'Request failed'), {
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
        throw new Error(data.detail || 'Upload failed');
      }
      return data;
    });
  },
};

