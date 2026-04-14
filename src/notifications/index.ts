import { NotificationRedirect } from './redirect';
import { NotificationTemplate } from './template';

export { NotificationTemplate };
export type { NotificationData } from './template';

// 注册通知模板
NotificationTemplate.register(new NotificationRedirect());
