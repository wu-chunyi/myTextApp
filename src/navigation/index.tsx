import React, { useCallback, useRef } from 'react';
import {
  NavigationContainer,
  createNavigationContainerRef,
  type NavigationState,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import { getAppScheme } from '../utils/environment';
import { MainTabNavigator } from './MainTabNavigator';
import { LoginScreen } from '../screens/login/LoginScreen';
import { VerifyCodeScreen } from '../screens/login/VerifyCodeScreen';
import { PaymentScreen } from '../screens/payment/PaymentScreen';
import { PaymentResultScreen } from '../screens/payment/PaymentResultScreen';
import type { RootStackParamList } from './types';

export { type RootStackParamList, type MainTabParamList } from './types';

// 全局 navigation ref
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Stack = createNativeStackNavigator<RootStackParamList>();

// 临时占位组件
const PlaceholderScreen = () => null;

/**
 * Deep Link 配置
 */
const linking = {
  prefixes: [
    Linking.createURL('/'),
    `${getAppScheme()}://`,
  ],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Discover: 'discover',
          My: 'my',
        },
      },
      Login: 'login',
      Redirect: 'redirect',
      Payment: 'payment',
      'Payment/Result': 'payment/result',
      Maintenance: 'maintenance',
    },
  },
} as const;

export const AppNavigator: React.FC = () => {
  const routeNameRef = useRef<string | undefined>(undefined);

  const onStateChange = useCallback((state?: NavigationState) => {
    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
    if (routeNameRef.current !== currentRouteName) {
      // TODO: 页面 PV 埋点
      routeNameRef.current = currentRouteName;
    }
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef as any}
      linking={linking as any}
      onStateChange={onStateChange}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerBackTitle: '',
        }}
      >
        {/* 主 Tab */}
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />

        {/* ---- 登录流程 ---- */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: '登录', headerShown: false }}
        />
        <Stack.Screen
          name="Login/VerifyCode"
          component={VerifyCodeScreen}
          options={{ title: '验证码' }}
        />

        {/* ---- 支付 ---- */}
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{ title: '支付', headerShown: false }}
        />
        <Stack.Screen
          name="Payment/Result"
          component={PaymentResultScreen}
          options={{ title: '支付结果', headerShown: false }}
        />

        {/* ---- 其他 ---- */}
        <Stack.Screen
          name="Redirect"
          component={PlaceholderScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Maintenance"
          component={PlaceholderScreen}
          options={{ title: '系统维护', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
