const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
  get: async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  post: async (endpoint: string, data: any, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Add other HTTP methods as needed
};

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'An error occurred');
  }
  return response.json();
}
