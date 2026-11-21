import * as Location from 'expo-location';

import type { Coordinates } from '@/domain/entities/island';
import type {
  GetCurrentPositionOptions,
  LocationRepository,
} from '@/domain/repositories/location-repository';

import {
  FOREGROUND_DISTANCE_INTERVAL_METERS,
  FOREGROUND_LOCATION_ACCURACY,
  PLACE_REGISTRATION_LOCATION_ACCURACY,
} from './constants';

async function ensureForegroundPermission(requestIfDenied: boolean): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) {
    return true;
  }
  if (!requestIfDenied) {
    return false;
  }
  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.granted;
}

export const expoLocationRepository: LocationRepository = {
  async getCurrentPosition(options?: GetCurrentPositionOptions): Promise<Coordinates | null> {
    try {
      const granted = await ensureForegroundPermission(options?.requestPermission === true);
      if (!granted) {
        return null;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: options?.highAccuracy
          ? PLACE_REGISTRATION_LOCATION_ACCURACY
          : FOREGROUND_LOCATION_ACCURACY,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      return null;
    }
  },

  async watchForegroundPosition(
    onMove: (coords: Coordinates) => void,
    onError?: () => void,
  ): Promise<() => void> {
    try {
      const granted = await ensureForegroundPermission(false);
      if (!granted) {
        return () => {};
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return () => {};
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: FOREGROUND_LOCATION_ACCURACY,
          distanceInterval: FOREGROUND_DISTANCE_INTERVAL_METERS,
        },
        (position) => {
          onMove({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          onError?.();
        },
      );

      return () => {
        subscription.remove();
      };
    } catch {
      onError?.();
      return () => {};
    }
  },
};
