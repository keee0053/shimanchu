import type { PlaceIslandType, RegisteredPlaces } from '@/domain/entities/island';

import {
  applyPlaceChangeAndSync,
  type PlaceChangeDeps,
  type PlaceChangeResult,
} from './place-change-sync';

type RemoveRegisteredPlaceInput = {
  type: PlaceIslandType;
  onPlacesUpdated?: (places: RegisteredPlaces) => void;
};

/**
 * 登録場所を端末から削除し、現在の島を再判定して同期するユースケース
 */
export function createRemoveRegisteredPlace(deps: PlaceChangeDeps) {
  return (input: RemoveRegisteredPlaceInput): Promise<PlaceChangeResult> =>
    applyPlaceChangeAndSync(deps, {
      mutatePlaces: () => deps.placeRepository.removeRegisteredPlace(input.type),
      onPlacesUpdated: input.onPlacesUpdated,
    });
}
