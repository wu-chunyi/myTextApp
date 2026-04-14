import type { NotificationContent } from 'expo-notifications';

import { navigationRef } from '../navigation';
import { NotificationTemplate, type NotificationData } from './template';

interface RedirectPayload {
  url?: string;
  to?: string;
  [key: string]: unknown;
}

/**
 * 重定向通知模板
 * 点击通知后跳转到指定页面
 */
export class NotificationRedirect extends NotificationTemplate<RedirectPayload> {
  immediate = false;

  constructor() {
    super('redirect');
  }

  async execute(
    data: NotificationData<RedirectPayload>,
    _content: NotificationContent
  ) {
    const { url, to, ...rest } = data.payload;
    if (to) {
      // @ts-ignore - dynamic navigation
      navigationRef.current?.navigate('Redirect', { to, url, ...rest });
    } else if (url) {
      // @ts-ignore - dynamic navigation
      navigationRef.current?.navigate('Redirect', { url });
    }
  }
}
