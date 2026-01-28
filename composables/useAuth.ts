import { ref, computed } from 'vue';
import type { UserProfile } from '~/models/userModel';

const currentUser = ref<UserProfile | null>(null);
const isAuthenticated = computed(() => !!currentUser.value);

export const useAuth = () => {
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const user = await response.json();
      currentUser.value = user;
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      currentUser.value = null;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const user = await response.json();
      currentUser.value = user;
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        currentUser.value = await response.json();
      }
    } catch (error) {
      console.error('Fetch current user error:', error);
    }
  };

  return {
    currentUser,
    isAuthenticated,
    login,
    logout,
    register,
    fetchCurrentUser,
  };
};
