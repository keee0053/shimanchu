import type { Coordinates } from '../entities/island';

export type GetCurrentPositionOptions = {
  highAccuracy?: boolean;
  requestPermission?: boolean;
};

export type LocationRepository = {
  getCurrentPosition(options?: GetCurrentPositionOptions): Promise<Coordinates | null>;
  watchForegroundPosition(onMove: (coords: Coordinates) => void): Promise<() => void>;
};
