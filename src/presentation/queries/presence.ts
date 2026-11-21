import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  UpdateMyLocationInput,
  UpdateMyLocationResult,
} from '@/application/update-my-location';
import { presenceRepository, updateMyLocation } from '@/container';
import type { IslandType, UserPresence } from '@/domain/entities/island';
import { queryClient } from '@/presentation/query-client';

export const presenceKeys = {
  all: ['presence'] as const,
  mine: () => ['presence', 'mine'] as const,
  latestEvaluation: () => ['presence', 'latest-evaluation'] as const,
};

// 画面から監視されていない間も直近の判定結果が既定の5分で GC されないように保持する
queryClient.setQueryDefaults(presenceKeys.latestEvaluation(), {
  gcTime: Infinity,
  staleTime: Infinity,
});

/**
 * 直近の更新経路（自動同期・手動更新・場所保存/解除）で共有されている現在の島を取得する
 */
export function getCurrentCachedIsland(client: QueryClient): IslandType | null {
  const latestEvaluation = client.getQueryData<UpdateMyLocationResult | null>(
    presenceKeys.latestEvaluation(),
  );
  if (latestEvaluation) {
    return latestEvaluation.islandType;
  }
  const serverPresence = client.getQueryData<UserPresence | null>(presenceKeys.mine());
  return serverPresence?.islandType ?? null;
}

/**
 * user_presence テーブルに保存されている自分の現在の島を取得する
 */
export function useMyPresence() {
  return useQuery<UserPresence | null>({
    queryKey: presenceKeys.mine(),
    queryFn: () => presenceRepository.findMyPresence(),
  });
}

/**
 * 直近のフォアグラウンド位置判定結果（未ログイン時も判定状態を確認できるようキャッシュで保持）
 */
export function useLatestPresenceEvaluation() {
  return useQuery<UpdateMyLocationResult | null>({
    queryKey: presenceKeys.latestEvaluation(),
    queryFn: () => null,
    enabled: false,
    initialData: null,
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

/**
 * 現在地を取得して島を判定し、user_presence に保存するミューテーション
 */
export function useUpdateMyLocation() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input?: UpdateMyLocationInput) => updateMyLocation(input),
    onSuccess: (result) => {
      client.setQueryData(presenceKeys.latestEvaluation(), result);
      if (result.presence) {
        client.setQueryData(presenceKeys.mine(), result.presence);
      }
    },
  });
}
