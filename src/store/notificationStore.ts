import { create } from 'zustand';

import { request } from '../services/request';

interface NotificationStats {
  unreadCount: number;
}

interface NotificationState {
  stats: NotificationStats;
  refreshStats: (userId: number) => Promise<void>;
  clearStats: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  stats: { unreadCount: 0 },

  refreshStats: async (userId: number) => {
    try {
      const stats = await request.get<NotificationStats>(
        `/api/v1/notifications/stats`,
        { userId }
      );
      set({ stats });
    } catch (error) {
      console.warn('refreshStats error:', error);
    }
  },

  clearStats: () => {
    set({ stats: { unreadCount: 0 } });
  },
}));
