import type { Coordinates, IslandType, UserPresence } from '@/domain/entities/island';
import type { LocationRepository } from '@/domain/repositories/location-repository';
import type { PlaceRepository } from '@/domain/repositories/place-repository';
import type { PresenceRepository } from '@/domain/repositories/presence-repository';
import { detectIsland } from '@/domain/services/island';

export type UpdateMyLocationDeps = {
  locationRepository: LocationRepository;
  placeRepository: PlaceRepository;
  presenceRepository: PresenceRepository;
};

export type UpdateMyLocationInput = {
  coords?: Coordinates | null;
  currentIsland?: IslandType | null;
};

export type UpdateMyLocationResult = {
  islandType: IslandType;
  updatedAt: string;
  presence: UserPresence | null;
};

/**
 * 現在地を取得し、登録済みの場所（家・学校）から島を判定して user_presence に保存するユースケース
 */
export function createUpdateMyLocation(deps: UpdateMyLocationDeps) {
  return async (input?: UpdateMyLocationInput): Promise<UpdateMyLocationResult> => {
    let coords: Coordinates | null = null;
    if (input?.coords !== undefined) {
      coords = input.coords;
    } else {
      try {
        coords = await deps.locationRepository.getCurrentPosition();
      } catch {
        coords = null;
      }
    }

    const places = await deps.placeRepository.getRegisteredPlaces();
    const islandType = detectIsland(coords, places, input?.currentIsland);
    const presence = await deps.presenceRepository.saveMyIsland(islandType);

    return {
      islandType,
      updatedAt: presence?.updatedAt ?? new Date().toISOString(),
      presence,
    };
  };
}
