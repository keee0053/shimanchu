import type { PreparedProfileImage, ProfileImageMimeType } from '@/domain/entities/profile-image';
import type { ProfileImageStorageRepository } from '@/domain/repositories/profile-image-repository';
import {
  isAllowedProfileImageMimeType,
  isValidProfileImageSize,
} from '@/domain/services/profile-image';

export type UploadProfileImageDeps = {
  storageRepository: ProfileImageStorageRepository;
};

export type UploadProfileImageUseCaseInput = {
  image: PreparedProfileImage;
  previousImagePath?: string | null;
  /** `false` の場合は `profiles.image_path` の更新および旧画像 `previousImagePath` の削除を行わない（呼び出し側で保存・解除時に整理する） */
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
 * 準備済みプロフィール画像を検証のうえ Supabase Storage へアップロードしてプロフィールを更新するユースケース
 */
export function createUploadProfileImage(deps: UploadProfileImageDeps) {
  return async (input: UploadProfileImageUseCaseInput): Promise<UploadProfileImageResult> => {
    const { image } = input;

    if (!isAllowedProfileImageMimeType(image.mimeType)) {
      throw new Error('対応していない画像形式です（JPEG・PNG・WebP のみアップロードできます）。');
    }
    if (!isValidProfileImageSize(image.sizeBytes)) {
      throw new Error('画像サイズが上限（2MB）を超えています。別の画像を選択してください。');
    }

    const newPath = await deps.storageRepository.uploadMyProfileImage({
      uri: image.uri,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes,
    });

    const shouldUpdateProfileRecord = input.updateProfileRecord !== false;

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
    const previousPath = input.previousImagePath;
    if (shouldUpdateProfileRecord && previousPath) {
      try {
        await deps.storageRepository.deleteProfileImage(previousPath);
      } catch {
        cleanupFailed = true;
      }
    }

    return {
      imagePath: newPath,
      localPreviewUri: image.uri,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes,
      cleanupFailed,
    };
  };
}
