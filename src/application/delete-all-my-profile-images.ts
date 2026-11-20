import type { ProfileImageStorageRepository } from '@/domain/repositories/profile-image-repository';

export type DeleteAllMyProfileImagesDeps = {
  storageRepository: ProfileImageStorageRepository;
};

/**
 * ログイン中のユーザーのプロフィール画像ファイルを Storage からすべて削除するユースケース（#35 連携用）
 */
export function createDeleteAllMyProfileImages(deps: DeleteAllMyProfileImagesDeps) {
  return async (): Promise<void> => {
    await deps.storageRepository.deleteAllMyProfileImages();
  };
}
