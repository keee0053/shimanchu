// 依存の組み立て（Composition Root）
// infrastructure の実装を domain のインターフェースに当てはめ、presentation に渡す。
// 層をまたいで import してよいのはこのファイルだけ（eslint.config.js のルール参照）。

import { createRemoveProfileImage } from '@/application/remove-profile-image';
import { createRemoveRegisteredPlace } from '@/application/remove-registered-place';
import { createSaveRegisteredPlace } from '@/application/save-registered-place';
import { createUpdateMyLocation } from '@/application/update-my-location';
import { createUploadProfileImage } from '@/application/upload-profile-image';
import type { LocationRepository } from '@/domain/repositories/location-repository';
import type { PlaceRepository } from '@/domain/repositories/place-repository';
import type { PresenceRepository } from '@/domain/repositories/presence-repository';
import type {
  ProfileImagePickerRepository,
  ProfileImageStorageRepository,
} from '@/domain/repositories/profile-image-repository';
import { asyncStoragePlaceRepository } from '@/infrastructure/location/async-storage-place-repository';
import { PRESENCE_HEARTBEAT_INTERVAL_MS } from '@/infrastructure/location/constants';
import { expoLocationRepository } from '@/infrastructure/location/expo-location-repository';
import { expoProfileImagePickerRepository } from '@/infrastructure/media/expo-profile-image-picker-repository';
import { supabasePresenceRepository } from '@/infrastructure/supabase/presence-repository';
import { supabaseProfileImageRepository } from '@/infrastructure/supabase/profile-image-repository';

export const locationRepository: LocationRepository = expoLocationRepository;
export const placeRepository: PlaceRepository = asyncStoragePlaceRepository;
export const presenceRepository: PresenceRepository = supabasePresenceRepository;

export const updateMyLocation = createUpdateMyLocation({
  locationRepository,
  placeRepository,
  presenceRepository,
});

export const saveRegisteredPlace = createSaveRegisteredPlace({
  placeRepository,
  updateMyLocation,
});

export const removeRegisteredPlace = createRemoveRegisteredPlace({
  placeRepository,
  updateMyLocation,
});

export { PRESENCE_HEARTBEAT_INTERVAL_MS };

export const profileImagePickerRepository: ProfileImagePickerRepository =
  expoProfileImagePickerRepository;
export const profileImageStorageRepository: ProfileImageStorageRepository =
  supabaseProfileImageRepository;

export const uploadProfileImage = createUploadProfileImage({
  pickerRepository: profileImagePickerRepository,
  storageRepository: profileImageStorageRepository,
});

export const removeProfileImage = createRemoveProfileImage({
  storageRepository: profileImageStorageRepository,
});
