import * as Linking from 'expo-linking';
import { useEffect } from 'react';

import { navigationRef } from '../navigation';
import { getAppScheme } from '../utils/environment';

interface ShareLinkParams {
  to?: string;
  url?: string;
  flag?: string;
  [key: string]: unknown;
}

/**
 * 从 Deep Link URL 中解析分享参数
 */
const parseShareLink = (url: string): ShareLinkParams | null => {
  try {
    const { hostname, queryParams } = Linking.parse(url);
    if ((hostname !== 'share' && hostname !== 'redirect') || !queryParams) {
      return null;
    }
    return {
      ...queryParams,
      to: queryParams?.to as string,
    };
  } catch {
    return null;
  }
};

/**
 * 分享链接 / Deep Link 处理 Hook
 *
 * 处理两种场景：
 * 1. 冷启动：App 未运行时点击链接打开
 * 2. 热启动：App 运行中收到新的链接
 */
export const useShareLink = () => {
  const handleShareLink = async (url: string) => {
    if (!url) return;
    const params = parseShareLink(url);
    if (!params) return;

    // 等 navigation 准备好
    const nav = navigationRef.current;
    if (!nav?.isReady()) {
      // 延迟重试
      setTimeout(() => handleShareLink(url), 500);
      return;
    }

    // @ts-ignore - dynamic navigation
    nav.navigate('Redirect', params);
  };

  useEffect(() => {
    // 冷启动：获取初始链接
    Linking.getInitialURL()
      .then((url) => {
        if (url) handleShareLink(url);
      })
      .catch((error) => {
        console.warn('getInitialURL error:', error);
      });

    // 热启动：监听新的链接
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleShareLink(url);
    });

    return () => subscription.remove();
  }, []);
};
