import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  Coordinates,
  PlaceIslandType,
  RegisteredPlace,
  RegisteredPlaces,
  UserPresence,
} from '@/domain/entities/island';
import { locationRepository, placeRepository, updateMyLocation } from '@/container';

import { presenceKeys } from './presence';

export const placeKeys = {
  all: ['places'] as const,
};

/**
 * 端末に保存されている家・学校の登録場所を取得する
 */
export function useRegisteredPlaces() {
  return useQuery<RegisteredPlaces>({
    queryKey: placeKeys.all,
    queryFn: () => placeRepository.getRegisteredPlaces(),
  });
}

/**
 * 家または学校の場所を端末に保存し、現在の島を再判定する
 */
export function useSaveRegisteredPlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { type: PlaceIslandType; place: RegisteredPlace }) => {
      const next = await placeRepository.saveRegisteredPlace(input.type, input.place);
      const currentIsland =
        queryClient.getQueryData<UserPresence | null>(presenceKeys.mine())?.islandType ?? null;
      const evaluation = await updateMyLocation({ currentIsland });
      return { places: next, evaluation };
    },
    onSuccess: ({ places, evaluation }) => {
      queryClient.setQueryData(placeKeys.all, places);
      queryClient.setQueryData(presenceKeys.latestEvaluation(), evaluation);
      if (evaluation.presence) {
        queryClient.setQueryData(presenceKeys.mine(), evaluation.presence);
      }
    },
  });
}

/**
 * 家または学校の登録を端末から削除し、現在の島を再判定する
 */
export function useRemoveRegisteredPlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: PlaceIslandType) => {
      const next = await placeRepository.removeRegisteredPlace(type);
      const currentIsland =
        queryClient.getQueryData<UserPresence | null>(presenceKeys.mine())?.islandType ?? null;
      const evaluation = await updateMyLocation({ currentIsland });
      return { places: next, evaluation };
    },
    onSuccess: ({ places, evaluation }) => {
      queryClient.setQueryData(placeKeys.all, places);
      queryClient.setQueryData(presenceKeys.latestEvaluation(), evaluation);
      if (evaluation.presence) {
        queryClient.setQueryData(presenceKeys.mine(), evaluation.presence);
      }
    },
  });
}

/**
 * 場所の登録用に高精度（Accuracy.High）で現在地を取得するミューテーション
 */
export function useCurrentPositionForRegistration() {
  return useMutation<Coordinates | null>({
    mutationFn: () => locationRepository.getCurrentPosition({ highAccuracy: true }),
  });
}
