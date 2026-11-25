import type {
  Coordinates,
  PlaceIslandType,
  RegisteredPlace,
  RegisteredPlaces,
} from '@/domain/entities/island';

import {
  applyPlaceChangeAndSync,
  type PlaceChangeDeps,
  type PlaceChangeResult,
} from './place-change-sync';

type SaveRegisteredPlaceInput = {
  type: PlaceIslandType;
  place: RegisteredPlace;
  coords?: Coordinates;
  onPlacesUpdated?: (places: RegisteredPlaces) => void;
};

/**
 * 登録場所を端末に保存し、現在の島を再判定して同期するユースケース
 */
export function createSaveRegisteredPlace(deps: PlaceChangeDeps) {
  return (input: SaveRegisteredPlaceInput): Promise<PlaceChangeResult> =>
    applyPlaceChangeAndSync(deps, {
      mutatePlaces: () => deps.placeRepository.saveRegisteredPlace(input.type, input.place),
      coords: input.coords,
      onPlacesUpdated: input.onPlacesUpdated,
    });
}
