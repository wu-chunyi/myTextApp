import type { NotificationContent } from 'expo-notifications';
import type { Notification } from 'expo-notifications';
import { Platform } from 'react-native';

export interface NotificationData<T = Record<string, unknown>> {
  type: string;
  userId: string;
  timestamp: string;
  payload: T;
}

/**
 * 通知模板基类 + 注册器
 * 支持注册不同类型的通知处理器，根据 type 字段分发处理
 */
export class NotificationTemplate<T = Record<string, unknown>> {
  static templates: Record<string, NotificationTemplate<unknown>> = {};

  static register<T>(template: NotificationTemplate<T>) {
    this.templates[template.type] =
      template as unknown as NotificationTemplate<unknown>;
  }

  /** 从原生通知中提取数据 */
  static getNotificationData<T = Record<string, unknown>>(
    notification: Notification
  ): NotificationData<T> | null {
    const { trigger, content } = notification.request;
    const hasPayload = trigger && typeof trigger === 'object' && 'payload' in trigger;
    const hasData = 'data' in content && typeof content.data === 'object';

    const data = Platform.select({
      ios: hasPayload ? (trigger as { payload: unknown }).payload : null,
      android: hasData ? content.data : null,
      default: null,
    });

    if (this.isNotificationData(data)) {
      return data as NotificationData<T>;
    }
    return null;
  }

  static isNotificationData(data: unknown): data is NotificationData {
    if (!data) return false;
    if (typeof data === 'object' && 'type' in data && typeof (data as { type: unknown }).type === 'string') {
      return true;
    }
    return false;
  }

  /** 根据类型执行对应模板 */
  static async execute(
    templateNotification: NotificationData,
    notificationContent: NotificationContent,
    immediate = false
  ) {
    const { type, payload } = templateNotification;
    const template = this.templates[type];
    if (!template) {
      console.warn(`Notification template "${type}" not registered.`);
      return;
    }
    if (immediate !== template.immediate) return;

    const data: NotificationData = { ...templateNotification };
    if (typeof payload === 'string') {
      try {
        data.payload = JSON.parse(payload);
      } catch (e) {
        console.error(`Error parsing notification payload:`, e);
        return;
      }
    }

    await template.execute(data, notificationContent);
  }

  type: string;
  /** true = 前台收到时立即执行；false = 用户点击通知后执行 */
  immediate = false;

  constructor(type: string) {
    this.type = type;
  }

  async execute(
    _data: NotificationData<T>,
    _notificationContent: NotificationContent
  ): Promise<void> {
    throw new Error('NotificationTemplate.execute() not implemented');
  }
}
