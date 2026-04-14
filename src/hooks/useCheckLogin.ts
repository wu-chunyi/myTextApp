import { useNavigation } from '@react-navigation/native';
import { useEffect, useCallback } from 'react';

import { tokenManager } from '../services/tokenManager';

/**
 * 登录检查 Hook
 * 检查是否已登录，未登录则跳转到登录页
 */
export const useCheckLogin = ({
  immediate = false,
}: {
  immediate: boolean;
}) => {
  const navigation = useNavigation();

  const checkLogin = useCallback(
    async (replace = true) => {
      if (tokenManager.isLogin) return true;

      if (replace) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else {
        navigation.navigate('Login' as never);
      }
      return false;
    },
    [navigation]
  );

  useEffect(() => {
    if (immediate) {
      checkLogin();
    }
  }, [immediate, checkLogin]);

  return { checkLogin };
};
