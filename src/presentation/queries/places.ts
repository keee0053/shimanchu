import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  locationRepository,
  placeRepository,
  removeRegisteredPlace,
  saveRegisteredPlace,
} from '@/container';
import type {
  Coordinates,
  PlaceIslandType,
  RegisteredPlace,
  RegisteredPlaces,
} from '@/domain/entities/island';

import { getCurrentCachedIsland, presenceKeys } from './presence';

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
    mutationFn: (input: {
      type: PlaceIslandType;
      place: RegisteredPlace;
      coords?: Coordinates;
      onPlacesCommitted?: (places: RegisteredPlaces) => void;
    }) =>
      saveRegisteredPlace({
        type: input.type,
        place: input.place,
        ...(input.coords !== undefined ? { coords: input.coords } : {}),
        currentIsland: getCurrentCachedIsland(queryClient),
        onPlacesUpdated: (places) => {
          queryClient.setQueryData(placeKeys.all, places);
          input.onPlacesCommitted?.(places);
        },
      }),
    onSuccess: ({ evaluation }) => {
      if (evaluation) {
        queryClient.setQueryData(presenceKeys.latestEvaluation(), evaluation);
        if (evaluation.presence) {
          queryClient.setQueryData(presenceKeys.mine(), evaluation.presence);
        }
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
    mutationFn: (input: {
      type: PlaceIslandType;
      onPlacesCommitted?: (places: RegisteredPlaces) => void;
    }) =>
      removeRegisteredPlace({
        type: input.type,
        currentIsland: getCurrentCachedIsland(queryClient),
        onPlacesUpdated: (places) => {
          queryClient.setQueryData(placeKeys.all, places);
          input.onPlacesCommitted?.(places);
        },
      }),
    onSuccess: ({ evaluation }) => {
      if (evaluation) {
        queryClient.setQueryData(presenceKeys.latestEvaluation(), evaluation);
        if (evaluation.presence) {
          queryClient.setQueryData(presenceKeys.mine(), evaluation.presence);
        }
      }
    },
  });
}

/**
 * 場所の登録用に高精度（Accuracy.High）で現在地を取得するミューテーション
 */
export function useCurrentPositionForRegistration() {
  return useMutation<Coordinates | null>({
    mutationFn: () =>
      locationRepository.getCurrentPosition({
        highAccuracy: true,
        requestPermission: true,
      }),
  });
}
