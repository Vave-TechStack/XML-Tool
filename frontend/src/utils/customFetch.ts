import { useAuthStore } from '@/store/authStore';
import Cookies from 'js-cookie';

/**
 * A global wrapper around the native `fetch` API.
 * 
 * This intercepts HTTP 401 Unauthorized responses from the backend.
 * If a 401 is detected, it assumes the user's session is either expired
 * or has been actively invalidated by another device logging in,
 * and automatically triggers a complete frontend logout, forcing them
 * back to the login screen.
 */
export const customFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> => {
  const token = Cookies.get('token');
  
  // Set up headers
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Override init with new headers
  const updatedInit = {
    ...init,
    headers,
  };

  const response = await fetch(input, updatedInit);

  if (response.status === 401) {
    // Session is invalid or token has changed (another device logged in)
    useAuthStore.getState().logout();
  }

  return response;
};
