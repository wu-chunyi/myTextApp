/**
 * 埋点分析抽象层
 *
 * 统一管理多个埋点发送器（Firebase / GA4 / AppsFlyer 等）
 * 参考 dp-client 的 Analytics + BaseAnalyticsSender 设计
 */

export interface AnalyticsSender {
  name: string;
  init(options?: Record<string, unknown>): void;
  set(params: Record<string, unknown>): void;
  send(eventName: string, eventParams: Record<string, unknown>): void;
}

class AnalyticsManager {
  private senders: Map<string, AnalyticsSender> = new Map();
  private globalParams: Record<string, unknown> = {};
  private _userId: string | null = null;

  get isCurrentUserSet(): boolean {
    return !!this._userId;
  }

  /** 注册埋点发送器 */
  addSender(name: string, sender: AnalyticsSender): void {
    this.senders.set(name, sender);
  }

  /** 移除发送器 */
  removeSender(name: string): void {
    this.senders.delete(name);
  }

  /** 设置全局参数（如 userId, pageName 等）*/
  set(params: Record<string, unknown>): void {
    this.globalParams = { ...this.globalParams, ...params };
    if (params.userId) {
      this._userId = params.userId as string;
    }
    this.senders.forEach((sender) => {
      try {
        sender.set(params);
      } catch (e) {
        console.warn(`Analytics.set error [${sender.name}]:`, e);
      }
    });
  }

  /** 发送事件 */
  event(eventName: string, eventParams: Record<string, unknown> = {}): void {
    const mergedParams = { ...this.globalParams, ...eventParams };
    this.senders.forEach((sender) => {
      try {
        sender.send(eventName, mergedParams);
      } catch (e) {
        console.warn(`Analytics.event error [${sender.name}]:`, e);
      }
    });
  }

  /** 初始化所有发送器 */
  init(options?: Record<string, unknown>): void {
    this.senders.forEach((sender) => {
      try {
        sender.init(options);
      } catch (e) {
        console.warn(`Analytics.init error [${sender.name}]:`, e);
      }
    });
  }
}

export const Analytics = new AnalyticsManager();

/**
 * Console 日志发送器（开发环境用）
 */
export class ConsoleAnalyticsSender implements AnalyticsSender {
  name = 'console';

  init(): void {
    console.log('[Analytics] Console sender initialized');
  }

  set(params: Record<string, unknown>): void {
    console.log('[Analytics] Set:', params);
  }

  send(eventName: string, eventParams: Record<string, unknown>): void {
    console.log(`[Analytics] Event: ${eventName}`, eventParams);
  }
}

// TODO: 实现 FirebaseAnalyticsSender
// TODO: 实现 AppsflyerAnalyticsSender
// TODO: 实现 SentryAnalyticsSender
