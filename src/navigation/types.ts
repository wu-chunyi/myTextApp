import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * 底部 Tab 路由参数
 */
export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  My: undefined;
};

/**
 * 根 Stack 路由参数
 */
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  // ---- 登录 ----
  Login: undefined;
  'Login/VerifyCode': {
    type: 'phone' | 'email';
    account: string;
    countryCode?: string;
    redirect?: string;
  };
  'Login/PasswordLogin': undefined;
  'Login/ThirdPartyLogin': { type: string };
  'Login/AccountInfo': Record<string, unknown>;
  'Login/VerifyIdentity': Record<string, unknown>;
  'Login/WelcomeBack': Record<string, unknown>;
  // ---- 支付 ----
  Payment: {
    paymentOrderId: string;
    orderType?: string;
    orderId?: string;
    shopId?: string;
    shopName?: string;
  };
  'Payment/Result': Record<string, string | undefined>;
  // ---- 其他 ----
  Redirect: { url?: string; to?: string; [key: string]: unknown };
  Maintenance: { module?: string };
  NoNetwork: undefined;
  WebView: { url: string; title?: string };
};

// 使声明合并，用于 useNavigation / useRoute 等 hook 的类型推导
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
