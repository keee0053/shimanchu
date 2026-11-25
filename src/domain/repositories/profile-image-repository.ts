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
  /**
   * 自分の `profiles.image_path` を更新する（該当行が存在する前提）。
   * `profiles` 行の作成前（初回設定）は更新できないため、ユースケース / ピッカー側で `updateProfileRecord: false` を指定する。
   */
  updateMyProfileImagePath(imagePath: string | null): Promise<void>;
  getSignedProfileImageUrl(imagePath: string): Promise<string>;
  deleteProfileImage(imagePath: string): Promise<void>;
};
