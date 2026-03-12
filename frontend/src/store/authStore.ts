import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id: number;
  email: string;
  role: 'SUPERADMIN' | 'EMPLOYEE' | 'SUBSCRIBER';
  subscription_active: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: Cookies.get('token') || null,
  user: null,

  setAuth: (token, user) => {
    Cookies.set('token', token, { expires: 1 }); // 1 day expiration
    set({ token, user });
  },

  logout: () => {
    Cookies.remove('token');
    set({ token: null, user: null });
  },

  checkAuth: async () => {
    const token = Cookies.get('token');
    if (!token) {
      get().logout();
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const userData = await res.json();
        set({ user: userData, token });
      } else {
        // Token was invalidated by backend (likely another device login)
        get().logout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      get().logout();
    }
  }
}));
