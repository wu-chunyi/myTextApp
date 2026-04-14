import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';

import { isNative } from './environment';

export enum ExpoUpdateStatus {
  Available = 'available',
  Fetched = 'fetched',
  Updated = 'updated',
  None = 'none',
}

// 简单的状态存储（生产环境可换成 MMKV 或 AsyncStorage）
let updateStatus: ExpoUpdateStatus = ExpoUpdateStatus.None;

/**
 * 弹出更新确认框
 */
const openUpdateDialog = (params: { okText?: string } = {}): Promise<void> => {
  return new Promise((resolve) => {
    Alert.alert(
      '发现新版本',
      '已发现新版本，需要进行更新',
      [
        {
          text: params.okText || '立即更新',
          onPress: () => resolve(),
        },
      ],
      { cancelable: false }
    );
  });
};

/**
 * 检查并执行 OTA 更新
 * 流程：检查 → 下载 → 弹窗 → 重启
 */
export async function checkForUpdate(): Promise<void> {
  if (!isNative) return;

  try {
    // 如果已下载更新但还没重启，直接弹窗
    if (updateStatus === ExpoUpdateStatus.Fetched) {
      await openUpdateDialog();
      updateStatus = ExpoUpdateStatus.Updated;
      await Updates.reloadAsync();
      return;
    }

    // 如果刚重启完成，提示更新成功
    if (updateStatus === ExpoUpdateStatus.Updated) {
      Alert.alert('更新完成', '已更新至最新版本');
      updateStatus = ExpoUpdateStatus.None;
      return;
    }

    // 检查更新
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      updateStatus = ExpoUpdateStatus.Available;

      // 下载更新
      await Updates.fetchUpdateAsync();
      updateStatus = ExpoUpdateStatus.Fetched;

      // 弹窗提示
      await openUpdateDialog();
      updateStatus = ExpoUpdateStatus.Updated;

      // 重启应用
      await Updates.reloadAsync();
    } else {
      updateStatus = ExpoUpdateStatus.None;
    }
  } catch (error) {
    console.error('checkForUpdate error:', error);
  }
}
