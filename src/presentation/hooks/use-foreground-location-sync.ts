import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { locationRepository, PRESENCE_HEARTBEAT_INTERVAL_MS } from '@/container';
import type { Coordinates } from '@/domain/entities/island';
import { getCurrentCachedIsland, useUpdateMyLocation } from '@/presentation/queries/presence';

type PendingLocationRequest = {
  hasPending: boolean;
  coords?: Coordinates | null;
};

/**
 * フォアグラウンドで位置情報を取得・監視し、user_presence を更新し続けるフック
 * - 起動時・フォアグラウンド復帰時に取得して判定・保存
 * - フォアグラウンド中は 100m 以上移動したときに再判定
 * - 島が変わらなくても 15 分ごとに upsert して updated_at を進める
 */
export function useForegroundLocationSync() {
  const queryClient = useQueryClient();
  const { mutateAsync } = useUpdateMyLocation();
  const mutateRef = useRef(mutateAsync);
  const syncingRef = useRef(false);
  const pendingRequestRef = useRef<PendingLocationRequest>({ hasPending: false });
  const isActiveSessionRef = useRef(false);

  useEffect(() => {
    mutateRef.current = mutateAsync;
  }, [mutateAsync]);

  useEffect(() => {
    let mounted = true;
    let stopWatching: (() => void) | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let sessionToken = 0;

    const syncLocation = async (coords?: Coordinates | null) => {
      if (!mounted) {
        return;
      }
      if (syncingRef.current) {
        pendingRequestRef.current = { hasPending: true, coords };
        return;
      }

      syncingRef.current = true;
      let nextCoords = coords;
      let hasNext = true;

      try {
        while (hasNext && mounted && isActiveSessionRef.current) {
          hasNext = false;
          try {
            await mutateRef.current({
              ...(nextCoords !== undefined ? { coords: nextCoords } : {}),
              currentIsland: getCurrentCachedIsland(queryClient),
            });
          } catch {
            // 権限拒否・通信エラー時もエラー画面にはしない
          }

          if (mounted && isActiveSessionRef.current && pendingRequestRef.current.hasPending) {
            nextCoords = pendingRequestRef.current.coords;
            pendingRequestRef.current = { hasPending: false };
            hasNext = true;
          }
        }
      } finally {
        syncingRef.current = false;
      }
    };

    const stopForegroundTracking = () => {
      sessionToken += 1;
      isActiveSessionRef.current = false;
      pendingRequestRef.current = { hasPending: false };
      if (stopWatching) {
        stopWatching();
        stopWatching = null;
      }
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    const startForegroundTracking = async () => {
      stopForegroundTracking();
      isActiveSessionRef.current = true;
      const currentToken = sessionToken;

      await syncLocation();
      if (!mounted || currentToken !== sessionToken) {
        return;
      }

      const unsubscribe = await locationRepository.watchForegroundPosition(
        (coords) => {
          void syncLocation(coords);
        },
        () => {
          void syncLocation(null);
        },
      );

      if (!mounted || currentToken !== sessionToken) {
        unsubscribe();
        return;
      }
      stopWatching = unsubscribe;

      heartbeatTimer = setInterval(() => {
        void syncLocation();
      }, PRESENCE_HEARTBEAT_INTERVAL_MS);
    };

    if (AppState.currentState === 'active') {
      void startForegroundTracking();
    }

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void startForegroundTracking();
      } else {
        stopForegroundTracking();
      }
    });

    return () => {
      mounted = false;
      stopForegroundTracking();
      subscription.remove();
    };
  }, [queryClient]);
}
