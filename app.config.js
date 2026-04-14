const { version } = require('./package.json');

const DefaultAppName = 'MyTestApp';
const DefaultAppIdentifier = 'com.wuexpo.mytestapp.dev';
const DefaultAppScheme = 'mytestapp-dev';

const splash = {
  image: './assets/splash-icon.png',
  resizeMode: 'contain',
  backgroundColor: '#ffffff',
};

module.exports = {
  expo: {
    name: process.env.APP_NAME || DefaultAppName,
    slug: 'my-test-app',
    version: version,
    scheme: process.env.APP_SCHEME || DefaultAppScheme,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    ios: {
      usesAppleSignIn: true,
      supportsTablet: false,
      bundleIdentifier:
        process.env.APP_UNIQUE_IDENTIFIER || DefaultAppIdentifier,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: '需要使用相机拍摄照片',
        NSPhotoLibraryUsageDescription: '需要访问相册选择照片',
        NSPhotoLibraryAddUsageDescription: '需要保存照片到相册',
        NSLocationWhenInUseUsageDescription: '需要获取位置信息',
        NSFaceIDUsageDescription: '使用 Face ID 进行身份验证',
        NSUserTrackingUsageDescription: '允许追踪以提供个性化服务',
      },
      entitlements: {
        'com.apple.developer.applesignin': ['Default'],
      },
      // googleServicesFile: process.env.IOS_GOOGLE_SERVICES_FILE,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: process.env.APP_UNIQUE_IDENTIFIER || DefaultAppIdentifier,
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_EXTERNAL_STORAGE',
      ],
      edgeToEdgeEnabled: true,
      // googleServicesFile: process.env.GOOGLE_SERVICES_FILE,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    updates: {
      url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID || 'a5c25b4e-d7e8-40b0-8489-a2024533e04a'}`,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    plugins: [
      'expo-secure-store',
      'expo-font',
      'expo-image-picker',
      'expo-localization',
      'expo-video',
      'expo-web-browser',
      'expo-location',
      'expo-notifications',
      'expo-tracking-transparency',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
        },
      ],
      ['expo-splash-screen', splash],
      // TODO: 添加 Firebase 插件
      // '@react-native-firebase/app',
      // '@react-native-firebase/crashlytics',
      // TODO: 添加 Sentry 插件
      // ['@sentry/react-native/expo', { ... }],
      // TODO: 添加 AppsFlyer 插件
      // ['react-native-appsflyer', { ... }],
    ],
    extra: {
      eas: {
        projectId: 'a5c25b4e-d7e8-40b0-8489-a2024533e04a',
      },
    },
    owner: 'wu-expo',
  },
};
