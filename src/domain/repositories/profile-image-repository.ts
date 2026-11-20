import type { PreparedProfileImage, ProfileImageMimeType } from '../entities/profile-image';

export type UploadProfileImageInput = {
  uri: string;
  mimeType: ProfileImageMimeType;
  sizeBytes: number;
};

export type ProfileImagePickerRepository = {
  pickAndPrepareProfileImage(): Promise<PreparedProfileImage | null>;
};

export type ProfileImageStorageRepository = {
  uploadMyProfileImage(input: UploadProfileImageInput): Promise<string>;
  updateMyProfileImagePath(imagePath: string | null): Promise<void>;
  getSignedProfileImageUrl(imagePath: string): Promise<string>;
  deleteProfileImage(imagePath: string): Promise<void>;
  deleteAllMyProfileImages(): Promise<void>;
};
