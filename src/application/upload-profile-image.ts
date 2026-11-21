import type { ProfileImageMimeType } from '@/domain/entities/profile-image';
import type {
  ProfileImagePickerRepository,
  ProfileImageStorageRepository,
} from '@/domain/repositories/profile-image-repository';
import {
  isAllowedProfileImageMimeType,
  isValidProfileImageSize,
} from '@/domain/services/profile-image';

export type UploadProfileImageDeps = {
  pickerRepository: ProfileImagePickerRepository;
  storageRepository: ProfileImageStorageRepository;
};

export type UploadProfileImageUseCaseInput = {
  previousImagePath?: string | null;
  /** `false` の場合は `profiles.image_path` の更新および旧画像 `previousImagePath` の削除を行わない */
  updateProfileRecord?: boolean;
};

export type UploadProfileImageResult = {
  imagePath: string;
  localPreviewUri: string;
  mimeType: ProfileImageMimeType;
  sizeBytes: number;
  cleanupFailed: boolean;
};

/**
 * 端末から画像を選び、縮小圧縮・検証のうえ Supabase Storage へアップロードしてプロフィールを更新するユースケース
 */
export function createUploadProfileImage(deps: UploadProfileImageDeps) {
  return async (
    input?: UploadProfileImageUseCaseInput,
  ): Promise<UploadProfileImageResult | null> => {
    const prepared = await deps.pickerRepository.pickAndPrepareProfileImage();
    if (!prepared) {
      return null;
    }

    if (!isAllowedProfileImageMimeType(prepared.mimeType)) {
      throw new Error('対応していない画像形式です（JPEG・PNG・WebP のみアップロードできます）。');
    }
    if (!isValidProfileImageSize(prepared.sizeBytes)) {
      throw new Error('画像サイズが上限（2MB）を超えています。別の画像を選択してください。');
    }

    const newPath = await deps.storageRepository.uploadMyProfileImage({
      uri: prepared.uri,
      mimeType: prepared.mimeType,
      sizeBytes: prepared.sizeBytes,
    });

    const shouldUpdateProfileRecord = input?.updateProfileRecord !== false;

    if (shouldUpdateProfileRecord) {
      try {
        await deps.storageRepository.updateMyProfileImagePath(newPath);
      } catch (error) {
        try {
          await deps.storageRepository.deleteProfileImage(newPath);
        } catch {
          // 孤立ファイル削除の失敗は元の更新エラーを優先する
        }
        throw error;
      }
    }

    let cleanupFailed = false;
    const previousPath = input?.previousImagePath;
    if (shouldUpdateProfileRecord && previousPath && previousPath !== newPath) {
      try {
        await deps.storageRepository.deleteProfileImage(previousPath);
      } catch {
        cleanupFailed = true;
      }
    }

    return {
      imagePath: newPath,
      localPreviewUri: prepared.uri,
      mimeType: prepared.mimeType,
      sizeBytes: prepared.sizeBytes,
      cleanupFailed,
    };
  };
}
