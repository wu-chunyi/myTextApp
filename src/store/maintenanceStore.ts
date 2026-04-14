import { create } from 'zustand';
import semver from 'semver';

import { request } from '../services/request';
import { getAppVersion } from '../utils/environment';

/**
 * 维护模块枚举
 */
export enum MaintenanceModule {
  Global = 'global',
  Payment = 'payment',
  // 按需扩展其他模块
}

interface MaintenanceData {
  /** 是否处于维护中 */
  underMaintenance: boolean;
  /** 最低版本要求 */
  lowestVersion?: string;
  /** 维护提示信息 */
  message?: string;
  /** 模块级维护状态 */
  modules?: Record<string, { underMaintenance: boolean; message?: string }>;
}

interface MaintenanceState {
  data: MaintenanceData | null;
  fetchMaintenanceData: () => Promise<void>;
  checkUnderMaintenance: (module: MaintenanceModule) => boolean;
  checkLowestVersion: (module: MaintenanceModule) => boolean;
}

export const useMaintenanceStore = create<MaintenanceState>()((set, get) => ({
  data: null,

  fetchMaintenanceData: async () => {
    try {
      const data = await request.get<MaintenanceData>('/api/v1/system/maintenance');
      set({ data });
    } catch (error) {
      console.warn('fetchMaintenanceData error:', error);
    }
  },

  checkUnderMaintenance: (module: MaintenanceModule) => {
    const { data } = get();
    if (!data) return false;
    if (module === MaintenanceModule.Global) return data.underMaintenance;
    return data.modules?.[module]?.underMaintenance || false;
  },

  checkLowestVersion: (_module: MaintenanceModule) => {
    const { data } = get();
    if (!data?.lowestVersion) return false;
    const currentVersion = getAppVersion();
    try {
      return semver.lt(currentVersion, data.lowestVersion);
    } catch {
      return false;
    }
  },
}));
