import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginRequest, LoginResponse } from '../services/types';
import axios from 'axios';
import { message } from 'antd';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
  hasRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: async (credentials: LoginRequest): Promise<boolean> => {
        try {
          set({ loading: true });
          const response = await axios.post<{ code: number; message: string; data: LoginResponse }>(
            '/api/auth/login',
            credentials
          );
          if (response.data.code !== 200) {
            throw new Error(response.data.message || '登录失败');
          }
          const { accessToken, user } = response.data.data;
          set({
            token: accessToken,
            user,
            isAuthenticated: true,
            loading: false,
          });
          message.success('登录成功');
          return true;
        } catch (error: any) {
          set({ loading: false });
          message.error(error.response?.data?.message || error.message || '登录失败');
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        message.success('已退出登录');
      },

      checkAuth: (): boolean => {
        const { token } = get();
        return !!token && !!get().isAuthenticated;
      },

      hasRole: (roles: string[]): boolean => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
