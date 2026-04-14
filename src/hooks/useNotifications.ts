import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { NotificationTemplate } from '../notifications';

// 前台通知显示配置
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 前台收到通知时的处理 Hook
 */
export function useNotificationReceived(
  callback?: (notification: Notifications.Notification) => void
) {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = NotificationTemplate.getNotificationData(notification);
        if (data) {
          NotificationTemplate.execute(data, notification.request.content, true);
        }
        callback?.(notification);
      }
    );
    return () => subscription.remove();
  }, [callback]);
}

/**
 * 用户点击通知时的处理 Hook
 */
export function useNotificationResponse(
  callback?: (notification: Notifications.Notification) => void
) {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const notification = response.notification;
        const data = NotificationTemplate.getNotificationData(notification);
        if (data) {
          NotificationTemplate.execute(data, notification.request.content, false);
        }
        callback?.(notification);
      }
    );
    return () => subscription.remove();
  }, [callback]);
}

/**
 * 获取推送 Device Token
 */
export async function getDeviceToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (e) {
    console.warn('getDeviceToken error:', e);
    return null;
  }
}
