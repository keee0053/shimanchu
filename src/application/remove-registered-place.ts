import type { IslandType, PlaceIslandType } from '@/domain/entities/island';
import type { PlaceRepository } from '@/domain/repositories/place-repository';

import type { PlaceChangeResult } from './save-registered-place';
import type { UpdateMyLocationInput, UpdateMyLocationResult } from './update-my-location';

export type RemoveRegisteredPlaceDeps = {
  placeRepository: PlaceRepository;
  updateMyLocation: (input?: UpdateMyLocationInput) => Promise<UpdateMyLocationResult>;
};

export type RemoveRegisteredPlaceInput = {
  type: PlaceIslandType;
  currentIsland?: IslandType | null;
};

/**
 * 登録場所を端末から削除し、現在の島を再判定して同期するユースケース
 */
export function createRemoveRegisteredPlace(deps: RemoveRegisteredPlaceDeps) {
  return async (input: RemoveRegisteredPlaceInput): Promise<PlaceChangeResult> => {
    const places = await deps.placeRepository.removeRegisteredPlace(input.type);
    try {
      const evaluation = await deps.updateMyLocation({
        currentIsland: input.currentIsland,
      });
      return { places, evaluation, syncFailed: false };
    } catch {
      return { places, evaluation: null, syncFailed: true };
    }
  };
}
