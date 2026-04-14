import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const GUEST_USER_ID_KEY = 'guest_user_id';

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

interface GuestTokens {
  guestUserId: string;
}

/**
 * Token 管理器
 * 负责 Token 的持久化存储、读取、刷新
 */
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private guestUserId: string | null = null;
  private _refreshTokenCallback: ((refreshToken: string) => Promise<AuthToken>) | null = null;
  private _unauthorizedCallback: (() => Promise<void>) | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  get isLogin(): boolean {
    return !!this.accessToken;
  }

  /** 初始化：从安全存储恢复 Token */
  async init(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        this.guestUserId = localStorage.getItem(GUEST_USER_ID_KEY);
      } else {
        this.accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        this.refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        this.guestUserId = await SecureStore.getItemAsync(GUEST_USER_ID_KEY);
      }
    } catch (e) {
      console.warn('TokenManager init error:', e);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  getGuestTokens(): GuestTokens | null {
    return this.guestUserId ? { guestUserId: this.guestUserId } : null;
  }

  /** 保存 Token */
  async saveTokens(tokens: AuthToken): Promise<void> {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      } else {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    } catch (e) {
      console.warn('TokenManager saveTokens error:', e);
    }
  }

  /** 保存访客标识 */
  async saveGuestTokens(tokens: GuestTokens): Promise<void> {
    this.guestUserId = tokens.guestUserId;
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(GUEST_USER_ID_KEY, tokens.guestUserId);
      } else {
        await SecureStore.setItemAsync(GUEST_USER_ID_KEY, tokens.guestUserId);
      }
    } catch (e) {
      console.warn('TokenManager saveGuestTokens error:', e);
    }
  }

  /** 清除访客标识 */
  async clearGuestTokens(): Promise<void> {
    this.guestUserId = null;
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(GUEST_USER_ID_KEY);
      } else {
        await SecureStore.deleteItemAsync(GUEST_USER_ID_KEY);
      }
    } catch (e) {
      console.warn('clearGuestTokens error:', e);
    }
  }

  /** 清除所有 Token */
  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    } catch (e) {
      console.warn('clearTokens error:', e);
    }
  }


  /** 设置刷新 Token 回调 */
  setRefreshTokenCallback(callback: (refreshToken: string) => Promise<AuthToken>): void {
    this._refreshTokenCallback = callback;
  }

  /** 设置未授权回调（Token 刷新失败时） */
  setUnauthorizedCallback(callback: () => Promise<void>): void {
    this._unauthorizedCallback = callback;
  }

  /** 刷新 Token */
  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken || !this._refreshTokenCallback) {
      await this._unauthorizedCallback?.();
      return null;
    }

    if (this.isRefreshing) {
      return new Promise<string>((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;
    try {
      const newTokens = await this._refreshTokenCallback(this.refreshToken);
      await this.saveTokens(newTokens);
      this.refreshSubscribers.forEach((cb) => cb(newTokens.accessToken));
      this.refreshSubscribers = [];
      return newTokens.accessToken;
    } catch (e) {
      this.refreshSubscribers = [];
      await this._unauthorizedCallback?.();
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  /** 判断是否是 401 错误 */
  isUnauthorizedError(status?: number | string): boolean {
    return status === 401 || status === '401';
  }
}

export const tokenManager = new TokenManager();