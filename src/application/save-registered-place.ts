import type {
  Coordinates,
  IslandType,
  PlaceIslandType,
  RegisteredPlace,
  RegisteredPlaces,
} from '@/domain/entities/island';
import type { PlaceRepository } from '@/domain/repositories/place-repository';

import type { UpdateMyLocationInput, UpdateMyLocationResult } from './update-my-location';

export type SaveRegisteredPlaceDeps = {
  placeRepository: PlaceRepository;
  updateMyLocation: (input?: UpdateMyLocationInput) => Promise<UpdateMyLocationResult>;
};

export type SaveRegisteredPlaceInput = {
  type: PlaceIslandType;
  place: RegisteredPlace;
  coords?: Coordinates;
  currentIsland?: IslandType | null;
  onPlacesUpdated?: (places: RegisteredPlaces) => void;
};

export type PlaceChangeResult = {
  places: RegisteredPlaces;
  evaluation: UpdateMyLocationResult | null;
  syncFailed: boolean;
};

/**
 * 登録場所を端末に保存し、現在の島を再判定して同期するユースケース
 */
export function createSaveRegisteredPlace(deps: SaveRegisteredPlaceDeps) {
  return async (input: SaveRegisteredPlaceInput): Promise<PlaceChangeResult> => {
    const places = await deps.placeRepository.saveRegisteredPlace(input.type, input.place);
    input.onPlacesUpdated?.(places);
    try {
      const evaluation = await deps.updateMyLocation({
        ...(input.coords !== undefined ? { coords: input.coords } : {}),
        currentIsland: input.currentIsland,
      });
      return { places, evaluation, syncFailed: false };
    } catch {
      return { places, evaluation: null, syncFailed: true };
    }
  };
}
