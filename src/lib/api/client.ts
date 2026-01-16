import { API_BASE_URL, getToken } from './config';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

// Create API client with JWT authentication
export const apiClient = async <T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { skipAuth = false, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add JWT token if available and not skipped
  if (!skipAuth) {
    const token = getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const error: ApiError = new Error(`API Error: ${response.status}`);
      error.status = response.status;
      
      try {
        error.data = await response.json();
      } catch {
        error.data = null;
      }
      
      throw error;
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return {} as T;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    
    // Network error or backend not running
    const networkError: ApiError = new Error(
      'Unable to connect to backend. Make sure Flask server is running on http://localhost:5000'
    );
    networkError.status = 0;
    throw networkError;
  }
};

// File upload client (multipart/form-data)
export const uploadClient = async <T>(
  endpoint: string,
  formData: FormData
): Promise<T> => {
  const token = getToken();
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = new Error(`Upload Error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return await response.json();
};
