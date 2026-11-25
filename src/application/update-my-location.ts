import type { Coordinates, IslandType, UserPresence } from '@/domain/entities/island';
import type { LocationRepository } from '@/domain/repositories/location-repository';
import type { PlaceRepository } from '@/domain/repositories/place-repository';
import type { PresenceRepository } from '@/domain/repositories/presence-repository';
import { detectIsland } from '@/domain/services/island';

type UpdateMyLocationDeps = {
  locationRepository: LocationRepository;
  placeRepository: PlaceRepository;
  presenceRepository: PresenceRepository;
};

export type UpdateMyLocationInput = {
  coords?: Coordinates | null;
  requestPermission?: boolean;
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
  let operationQueue: Promise<unknown> = Promise.resolve();
  // TODO(#94): ログアウト・アカウント切り替え時に lastResolvedIsland をリセットする
  let lastResolvedIsland: IslandType | null = null;

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = operationQueue.then(operation, operation);
    operationQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  return (input?: UpdateMyLocationInput): Promise<UpdateMyLocationResult> =>
    enqueue(async () => {
      let coords: Coordinates | null = null;
      if (input?.coords !== undefined) {
        coords = input.coords;
      } else {
        try {
          coords = await deps.locationRepository.getCurrentPosition({
            requestPermission: input?.requestPermission === true,
          });
        } catch {
          coords = null;
        }
      }

      const places = await deps.placeRepository.getRegisteredPlaces();
      const islandType = detectIsland(coords, places, lastResolvedIsland);
      const presence = await deps.presenceRepository.saveMyIsland(islandType);
      lastResolvedIsland = islandType;

      return {
        islandType,
        updatedAt: presence?.updatedAt ?? new Date().toISOString(),
        presence,
      };
    });
}
