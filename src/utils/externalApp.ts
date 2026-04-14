import { Linking, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export type ExternalAppType =
  | 'line'
  | 'messenger'
  | 'whatsapp'
  | 'telegram'
  | 'email'
  | 'phone'
  | 'sms'
  | 'maps'
  | 'browser'
  | 'custom';

export interface ExternalAppConfig {
  appType: ExternalAppType;
  customScheme?: string;
  params?: Record<string, string | number | boolean | undefined>;
  fallbackUrl?: string;
  redirectToStore?: boolean;
}

const APP_STORE_URLS: Record<string, { ios: string; android: string }> = {
  line: {
    ios: 'https://apps.apple.com/app/line/id443904275',
    android: 'https://play.google.com/store/apps/details?id=jp.naver.line.android',
  },
  whatsapp: {
    ios: 'https://apps.apple.com/app/whatsapp-messenger/id310633997',
    android: 'https://play.google.com/store/apps/details?id=com.whatsapp',
  },
  telegram: {
    ios: 'https://apps.apple.com/app/telegram-messenger/id686449807',
    android: 'https://play.google.com/store/apps/details?id=org.telegram.messenger',
  },
};

/**
 * 跳转到外部应用
 */
export const openExternalApp = async (config: ExternalAppConfig): Promise<boolean> => {
  const { appType, customScheme, params = {}, fallbackUrl, redirectToStore = true } = config;
  try {
    let targetUrl = '';
    const message = params.text ? String(params.text) : '';
    const url = params.url ? String(params.url) : '';
    const shareContent = url ? `${message} ${url}`.trim() : message;

    switch (appType) {
      case 'line':
        targetUrl = params.text
          ? `line://msg/text/?${encodeURIComponent(shareContent)}`
          : 'line://';
        break;
      case 'messenger':
        await Share.share({ message: shareContent });
        return true;
      case 'whatsapp': {
        const parts: string[] = [];
        if (params.text) parts.push(`text=${encodeURIComponent(String(params.text))}`);
        if (params.phone) parts.push(`phone=${String(params.phone)}`);
        targetUrl = `whatsapp://send?${parts.join('&')}`;
        break;
      }
      case 'telegram':
        targetUrl = params.text
          ? `tg://msg?text=${encodeURIComponent(shareContent)}`
          : 'tg://';
        break;
      case 'email': {
        const emailParts: string[] = [];
        if (params.subject) emailParts.push(`subject=${encodeURIComponent(String(params.subject))}`);
        if (params.body) emailParts.push(`body=${encodeURIComponent(String(params.body))}`);
        targetUrl = `mailto:${params.to || ''}${emailParts.length ? '?' + emailParts.join('&') : ''}`;
        break;
      }
      case 'phone':
        targetUrl = `tel:${params.number || ''}`;
        break;
      case 'sms':
        targetUrl = params.body
          ? `sms:${params.number || ''}?body=${encodeURIComponent(String(params.body))}`
          : `sms:${params.number || ''}`;
        break;
      case 'maps':
        targetUrl = params.address
          ? `maps://?q=${encodeURIComponent(String(params.address))}`
          : params.lat && params.lng
            ? `maps://?ll=${params.lat},${params.lng}`
            : 'maps://';
        break;
      case 'browser':
        await Clipboard.setStringAsync(shareContent);
        return true;
      case 'custom':
        if (!customScheme) return false;
        targetUrl = customScheme;
        break;
      default:
        return false;
    }

    // 尝试打开
    const canOpen = await Linking.canOpenURL(targetUrl);
    if (canOpen) {
      await Linking.openURL(targetUrl);
      return true;
    }

    // 回退到 fallback 或应用市场
    if (fallbackUrl) {
      await Linking.openURL(fallbackUrl);
      return true;
    }
    if (redirectToStore && APP_STORE_URLS[appType]) {
      const storeUrl = Platform.OS === 'ios'
        ? APP_STORE_URLS[appType].ios
        : APP_STORE_URLS[appType].android;
      await Linking.openURL(storeUrl);
      return true;
    }
    return false;
  } catch (error) {
    console.error('openExternalApp error:', error);
    return false;
  }
};
