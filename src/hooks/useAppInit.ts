import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { tokenManager } from '../services/tokenManager';
import { refreshToken } from '../screens/login/api';
import { isProduction, isNative } from '../utils/environment';
import { checkForUpdate } from '../utils/expoUpdate';
import { Analytics, ConsoleAnalyticsSender } from '../utils/analytics';

SplashScreen.preventAutoHideAsync();

/**
 * 应用初始化 Hook
 * 负责启动时的初始化逻辑：Token 恢复、请求配置、OTA 检查等
 */
export function useAppInit() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // 1. 恢复 Token
        await tokenManager.init();

        // 2. 配置 Token 刷新回调
        tokenManager.setRefreshTokenCallback(async (rt) => {
          return await refreshToken(rt);
        });

        // 3. 配置未授权回调
        tokenManager.setUnauthorizedCallback(async () => {
          await tokenManager.clearTokens();
          // TODO: 跳转到登录页
        });

        // 4. 初始化埋点（开发环境用 Console）
        if (!isProduction) {
          Analytics.addSender('console', new ConsoleAnalyticsSender());
        }
        Analytics.init();

        // 5. 检查 OTA 更新（生产环境 + 原生端）
        if (isNative && isProduction) {
          checkForUpdate();
        }
      } catch (e) {
        console.warn('App init error:', e);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    }
    init();
  }, []);

  return { isReady };
}
