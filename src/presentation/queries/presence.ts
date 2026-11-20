import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  UpdateMyLocationInput,
  UpdateMyLocationResult,
} from '@/application/update-my-location';
import { presenceRepository, updateMyLocation } from '@/container';
import type { UserPresence } from '@/domain/entities/island';

export const presenceKeys = {
  all: ['presence'] as const,
  mine: () => ['presence', 'mine'] as const,
  latestEvaluation: () => ['presence', 'latest-evaluation'] as const,
};

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
  });
}

/**
 * 現在地を取得して島を判定し、user_presence に保存するミューテーション
 */
export function useUpdateMyLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: UpdateMyLocationInput) => updateMyLocation(input),
    onSuccess: (result) => {
      queryClient.setQueryData(presenceKeys.latestEvaluation(), result);
      if (result.presence) {
        queryClient.setQueryData(presenceKeys.mine(), result.presence);
      }
    },
  });
}
