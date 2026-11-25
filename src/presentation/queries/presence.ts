import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UpdateMyLocationInput } from '@/application/update-my-location';
import { presenceRepository, updateMyLocation } from '@/container';
import type { UserPresence } from '@/domain/entities/island';
import { usePresenceEvaluationStore } from '@/presentation/stores/presence-evaluation-store';

export const presenceKeys = {
  all: ['presence'] as const,
  mine: () => ['presence', 'mine'] as const,
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
 * 現在地を取得して島を判定し、user_presence に保存するミューテーション
 */
export function useUpdateMyLocation() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input?: UpdateMyLocationInput) => updateMyLocation(input),
    onSuccess: (result) => {
      usePresenceEvaluationStore.getState().setLatestEvaluation(result);
      if (result.presence) {
        client.setQueryData(presenceKeys.mine(), result.presence);
      }
    },
  });
}
