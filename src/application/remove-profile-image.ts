import type { ProfileImageStorageRepository } from '@/domain/repositories/profile-image-repository';

export type RemoveProfileImageDeps = {
  storageRepository: ProfileImageStorageRepository;
};

export type RemoveProfileImageUseCaseInput = {
  currentImagePath?: string | null;
  updateProfileRecord?: boolean;
};

/**
 * プロフィール画像の設定を解除し、Storage 上の画像ファイルを削除するユースケース
 */
export function createRemoveProfileImage(deps: RemoveProfileImageDeps) {
  return async (input: RemoveProfileImageUseCaseInput): Promise<{ cleanupFailed: boolean }> => {
    if (input.updateProfileRecord !== false) {
      await deps.storageRepository.updateMyProfileImagePath(null);
    }

    if (!input.currentImagePath) {
      return { cleanupFailed: false };
    }

    try {
      await deps.storageRepository.deleteProfileImage(input.currentImagePath);
      return { cleanupFailed: false };
    } catch {
      return { cleanupFailed: true };
    }
  };
}
