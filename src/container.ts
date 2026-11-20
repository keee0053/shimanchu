// 依存の組み立て（Composition Root）
// infrastructure の実装を domain のインターフェースに当てはめ、presentation に渡す。
// 層をまたいで import してよいのはこのファイルだけ（eslint.config.js のルール参照）。

import { createDeleteAllMyProfileImages } from '@/application/delete-all-my-profile-images';
import { createRemoveProfileImage } from '@/application/remove-profile-image';
import { createUploadProfileImage } from '@/application/upload-profile-image';
import type {
  ProfileImagePickerRepository,
  ProfileImageStorageRepository,
} from '@/domain/repositories/profile-image-repository';
import { expoProfileImagePickerRepository } from '@/infrastructure/media/expo-profile-image-picker-repository';
import { supabaseProfileImageRepository } from '@/infrastructure/supabase/profile-image-repository';

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

export const deleteAllMyProfileImages = createDeleteAllMyProfileImages({
  storageRepository: profileImageStorageRepository,
});
