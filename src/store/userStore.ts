import { create } from 'zustand';

import { tokenManager } from '../services/tokenManager';
import { request } from '../services/request';

/**
 * 用户信息接口
 */
export interface UserProfile {
  id: number;
  username: string;
  nickname: string;
  phone?: string;
  email?: string;
  avatar?: string;
  displayUid?: string;
}

interface UserState {
  /** 用户信息 */
  userProfile: UserProfile | null;
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;

  /** 是否是访客模式 */
  getIsGuestMode: () => boolean;
  /** 获取用户信息 */
  fetchUserProfile: () => Promise<UserProfile>;
  /** 更新用户信息 */
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  /** 清空登录信息 */
  clearLoginInfo: () => Promise<void>;
  /** 重置状态 */
  resetState: () => void;
}

const initialState = {
  userProfile: null,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserState>()((set, get) => ({
  ...initialState,

  getIsGuestMode: () => {
    return !tokenManager.isLogin;
  },

  fetchUserProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await request.get<UserProfile>('/api/v1/users/profile');
      set({ userProfile: profile, isLoading: false });
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取用户信息失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateUserProfile: (profile) => {
    set((state) => ({
      userProfile: state.userProfile
        ? { ...state.userProfile, ...profile }
        : null,
    }));
  },

  clearLoginInfo: async () => {
    await tokenManager.clearTokens();
    set(initialState);
  },

  resetState: () => {
    set(initialState);
  },
}));
