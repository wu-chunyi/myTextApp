import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { getApiBaseUrl } from '../utils/environment';
import { tokenManager, type AuthToken } from './tokenManager';

/**
 * API 响应标准格式
 */
export interface ApiResponse<T = unknown> {
  code: number | string;
  message: string;
  data: T;
}

/**
 * 扩展请求配置
 */
export interface RequestOptions extends AxiosRequestConfig {
  /** 是否显示错误提示，false 则不显示 */
  errorMsg?: string | false;
  /** 是否跳过队列 */
  noQueue?: boolean;
  /** 是否不捕获错误 */
  noErrorCatch?: boolean;
}

// 创建 Axios 实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- 请求拦截器 ----
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      // 访客模式
      config.headers.set('X-Guest-Mode', '1');
      const guestTokens = tokenManager.getGuestTokens();
      if (guestTokens) {
        config.headers.set('X-Guest-User-Id', guestTokens.guestUserId);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- 响应拦截器 ----
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 保存访客 userId
    const guestUserId = response.headers['x-guest-user-id'];
    if (guestUserId) {
      tokenManager.saveGuestTokens({ guestUserId });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 Token 过期 → 刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await tokenManager.refreshAccessToken();
      if (newToken) {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      }
    }

    // 统一错误处理
    if (!axios.isCancel(error)) {
      const config = error.config as RequestOptions;
      if (config?.errorMsg !== false) {
        const message =
          config?.errorMsg ||
          error.response?.data?.message ||
          error.message ||
          '网络异常，请重试';
        // TODO: 接入 Toast 组件显示错误
        console.warn('[Request Error]', message);
      }
    }

    return Promise.reject(error);
  }
);

// ---- 封装请求方法 ----
export const request = {
  axiosInstance,

  async get<T = unknown>(url: string, params?: Record<string, unknown>, config?: RequestOptions): Promise<T> {
    const res = await axiosInstance.get<ApiResponse<T>>(url, { params, ...config });
    return res.data.data;
  },

  async post<T = unknown>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
    const res = await axiosInstance.post<ApiResponse<T>>(url, data, config);
    return res.data.data;
  },

  async put<T = unknown>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
    const res = await axiosInstance.put<ApiResponse<T>>(url, data, config);
    return res.data.data;
  },

  async delete<T = unknown>(url: string, config?: RequestOptions): Promise<T> {
    const res = await axiosInstance.delete<ApiResponse<T>>(url, config);
    return res.data.data;
  },

  /** 动态设置 Header */
  setHeader(key: string, value: string): void {
    axiosInstance.defaults.headers.common[key] = value;
  },
};
