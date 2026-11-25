import type { ProfileImageStorageRepository } from '@/domain/repositories/profile-image-repository';

type RemoveProfileImageDeps = {
  storageRepository: ProfileImageStorageRepository;
};

export type RemoveProfileImageUseCaseInput = {
  currentImagePath?: string | null;
  /** `updateProfileRecord: false` のとき、同一画面内でアップロード済み・DB 未保存の候補があれば指定して即座に削除する */
  unpersistedImagePath?: string | null;
  /** `false` の場合は `profiles.image_path` の更新および DB 保存済み画像 `currentImagePath` の削除を行わない（`uploadProfileImage` と対称） */
  updateProfileRecord: boolean;
};

/**
 * プロフィール画像の設定を解除し、Storage 上の画像ファイルを削除するユースケース
 */
export function createRemoveProfileImage(deps: RemoveProfileImageDeps) {
  return async (input: RemoveProfileImageUseCaseInput): Promise<{ cleanupFailed: boolean }> => {
    if (input.updateProfileRecord) {
      await deps.storageRepository.updateMyProfileImagePath(null);
    }

    const pathToDelete = input.updateProfileRecord
      ? input.currentImagePath
      : input.unpersistedImagePath;
    if (!pathToDelete) {
      return { cleanupFailed: false };
    }

    try {
      await deps.storageRepository.deleteProfileImage(pathToDelete);
      return { cleanupFailed: false };
    } catch {
      return { cleanupFailed: true };
    }
  };
}
