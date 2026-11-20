import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { locationRepository, PRESENCE_HEARTBEAT_INTERVAL_MS } from '@/container';
import type { Coordinates, IslandType } from '@/domain/entities/island';
import { useUpdateMyLocation } from '@/presentation/queries/presence';

/**
 * フォアグラウンドで位置情報を取得・監視し、user_presence を更新し続けるフック
 * - 起動時・フォアグラウンド復帰時に取得して判定・保存
 * - フォアグラウンド中は 100m 以上移動したときに再判定
 * - 島が変わらなくても 15 分ごとに upsert して updated_at を進める
 */
export function useForegroundLocationSync() {
  const { mutateAsync } = useUpdateMyLocation();
  const mutateRef = useRef(mutateAsync);
  const currentIslandRef = useRef<IslandType | null>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    mutateRef.current = mutateAsync;
  }, [mutateAsync]);

  useEffect(() => {
    let mounted = true;
    let stopWatching: (() => void) | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let sessionToken = 0;

    const syncLocation = async (coords?: Coordinates | null) => {
      if (!mounted || syncingRef.current) {
        return;
      }
      syncingRef.current = true;
      try {
        const result = await mutateRef.current({
          ...(coords !== undefined ? { coords } : {}),
          currentIsland: currentIslandRef.current,
        });
        if (mounted) {
          currentIslandRef.current = result.islandType;
        }
      } catch {
        // 権限拒否・通信エラー時もエラー画面にはしない
      } finally {
        syncingRef.current = false;
      }
    };

    const stopForegroundTracking = () => {
      sessionToken += 1;
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
  }, []);
}
