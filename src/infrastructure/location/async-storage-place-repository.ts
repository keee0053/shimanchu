import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  EMPTY_REGISTERED_PLACES,
  PLACE_RADIUS_OPTIONS,
  type PlaceIslandType,
  type PlaceRadius,
  type RegisteredPlace,
  type RegisteredPlaces,
} from '@/domain/entities/island';
import type { PlaceRepository } from '@/domain/repositories/place-repository';

const STORAGE_KEY = 'shimanchu:registered_places_v1';

let operationQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = operationQueue.then(operation, operation);
  operationQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function isValidPlaceRadius(value: unknown): value is PlaceRadius {
  return typeof value === 'number' && (PLACE_RADIUS_OPTIONS as readonly number[]).includes(value);
}

function parseRegisteredPlace(value: unknown): RegisteredPlace | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  const coords = candidate.coordinates as Record<string, unknown> | undefined;
  if (!coords || typeof coords !== 'object') {
    return null;
  }
  const latitude = coords.latitude;
  const longitude = coords.longitude;
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }
  if (!isValidPlaceRadius(candidate.radius)) {
    return null;
  }
  return {
    coordinates: { latitude, longitude },
    radius: candidate.radius,
  };
}

function parseRegisteredPlaces(raw: string | null): RegisteredPlaces {
  if (!raw) {
    return EMPTY_REGISTERED_PLACES;
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') {
      return EMPTY_REGISTERED_PLACES;
    }
    return {
      home: parseRegisteredPlace(parsed.home),
      school: parseRegisteredPlace(parsed.school),
    };
  } catch {
    return EMPTY_REGISTERED_PLACES;
  }
}

async function readRegisteredPlaces(): Promise<RegisteredPlaces> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return parseRegisteredPlaces(raw);
}

export const asyncStoragePlaceRepository: PlaceRepository = {
  getRegisteredPlaces(): Promise<RegisteredPlaces> {
    return enqueue(() => readRegisteredPlaces());
  },

  saveRegisteredPlace(type: PlaceIslandType, place: RegisteredPlace): Promise<RegisteredPlaces> {
    return enqueue(async () => {
      const current = await readRegisteredPlaces();
      const next: RegisteredPlaces = {
        ...current,
        [type]: place,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  },

  removeRegisteredPlace(type: PlaceIslandType): Promise<RegisteredPlaces> {
    return enqueue(async () => {
      const current = await readRegisteredPlaces();
      const next: RegisteredPlaces = {
        ...current,
        [type]: null,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  },
};
