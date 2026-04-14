import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './navigation';
import { useAppInit } from './hooks/useAppInit';
import { useShareLink } from './hooks/useShareLink';
import { useNotificationReceived, useNotificationResponse } from './hooks/useNotifications';

// 导入通知模板注册（副作用）
import './notifications';

const App: React.FC = () => {
  const { isReady } = useAppInit();

  // Deep Link 处理
  useShareLink();

  // 推送通知处理
  useNotificationReceived();
  useNotificationResponse();

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
