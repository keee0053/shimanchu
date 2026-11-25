import type { Coordinates, RegisteredPlaces } from '@/domain/entities/island';
import type { PlaceRepository } from '@/domain/repositories/place-repository';

import type { UpdateMyLocationInput, UpdateMyLocationResult } from './update-my-location';

export type PlaceChangeDeps = {
  placeRepository: PlaceRepository;
  updateMyLocation: (input?: UpdateMyLocationInput) => Promise<UpdateMyLocationResult>;
};

export type PlaceChangeResult = {
  places: RegisteredPlaces;
  evaluation: UpdateMyLocationResult | null;
  syncFailed: boolean;
};

/**
 * 登録場所を変更（保存・削除）し、コールバック通知のうえで現在の島を再判定して同期する共通処理
 */
export async function applyPlaceChangeAndSync(
  deps: Pick<PlaceChangeDeps, 'updateMyLocation'>,
  options: {
    mutatePlaces: () => Promise<RegisteredPlaces>;
    coords?: Coordinates;
    onPlacesUpdated?: (places: RegisteredPlaces) => void;
  },
): Promise<PlaceChangeResult> {
  const places = await options.mutatePlaces();
  options.onPlacesUpdated?.(places);
  try {
    const evaluation = await deps.updateMyLocation({ coords: options.coords });
    return { places, evaluation, syncFailed: false };
  } catch {
    return { places, evaluation: null, syncFailed: true };
  }
}
