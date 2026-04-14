import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { Environment } from '../types';

/**
 * 当前环境
 */
export const environment: Environment =
  (process.env.EXPO_PUBLIC_ENV as Environment) || 'DEV';

export const isDev = environment === 'DEV' || environment === 'LOCAL';
export const isUAT = environment === 'PRE';
export const isRC = environment === 'RC';
export const isProduction = environment === 'ONLINE';

/**
 * API 基础 URL 映射
 */
/**
 * API 基础 URL 映射
 *
 * 自用部署：所有环境指向同一台服务器即可
 * 例如你买了域名 myapp.com，服务器 IP 1.2.3.4
 * 域名解析 api.myapp.com → 1.2.3.4
 * 然后把下面的域名改成你的正式 API 地址
 */
const API_BASE_URL_MAP: Record<Environment, string> = {
  LOCAL: 'http://localhost:3000',
  DEV: process.env.EXPO_PUBLIC_API_URL_DEV || 'http://localhost:3000',
  PRE: process.env.EXPO_PUBLIC_API_URL_PRE || 'https://peerless.chat',
  RC: process.env.EXPO_PUBLIC_API_URL_RC || 'https://peerless.chat',
  ONLINE: process.env.EXPO_PUBLIC_API_URL || 'https://peerless.chat',
};

export const getApiBaseUrl = (): string => {
  return API_BASE_URL_MAP[environment];
};

/**
 * APP Scheme 映射
 */
const APP_SCHEME_MAP: Record<Environment, string> = {
  LOCAL: process.env.EXPO_PUBLIC_APP_SCHEME_LOCAL || 'mytestapp-dev',
  DEV: process.env.EXPO_PUBLIC_APP_SCHEME_DEV || 'mytestapp-dev',
  PRE: process.env.EXPO_PUBLIC_APP_SCHEME_PRE || 'mytestapp-pre',
  RC: process.env.EXPO_PUBLIC_APP_SCHEME_RC || 'mytestapp-rc',
  ONLINE: process.env.EXPO_PUBLIC_APP_SCHEME_ONLINE || 'mytestapp',
};

export const getAppScheme = (env: Environment = environment): string => {
  return APP_SCHEME_MAP[env];
};

/**
 * 是否是原生平台
 */
export const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

/**
 * 获取应用版本号
 */
export const getAppVersion = (): string => {
  return Constants.expoConfig?.version || '1.0.0';
};
