import type { Coordinates, PlaceRadius } from '@/domain/entities/island';

export type PlaceMapPickerProps = {
  coordinates: Coordinates | null;
  radius: PlaceRadius;
  accentColor: string;
  fillColor: string;
  focusVersion: number;
  onChangeCoordinates: (coords: Coordinates) => void;
};
