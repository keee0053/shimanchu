import type { PlaceIslandType, RegisteredPlace, RegisteredPlaces } from '../entities/island';

export type PlaceRepository = {
  getRegisteredPlaces(): Promise<RegisteredPlaces>;
  saveRegisteredPlace(type: PlaceIslandType, place: RegisteredPlace): Promise<RegisteredPlaces>;
  removeRegisteredPlace(type: PlaceIslandType): Promise<RegisteredPlaces>;
};
