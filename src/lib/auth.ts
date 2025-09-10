// Token management for JWT authentication

const TOKEN_STORAGE_KEY = 'lovable_jwt_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

// Helper function to make authenticated requests
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  
  const headers = {
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    clearToken();
    localStorage.removeItem('lovable_user');
    window.location.reload(); // Force re-authentication
  }

  return response;
};

// Extract token from response - handles multiple possible field names and array responses
export const extractToken = (data: any): string | null => {
  if (!data) return null;

  // Handle array responses - take first item
  if (Array.isArray(data) && data.length > 0) {
    data = data[0];
  }

  // Check common token field names
  const tokenFields = ['token', 'jwt', 'access_token', 'accessToken'];
  
  for (const field of tokenFields) {
    if (data[field]) {
      return data[field];
    }
  }

  return null;
};