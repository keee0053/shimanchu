import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { RemoveProfileImageUseCaseInput } from '@/application/remove-profile-image';
import type { UploadProfileImageUseCaseInput } from '@/application/upload-profile-image';
import { profileImageStorageRepository, removeProfileImage, uploadProfileImage } from '@/container';

const SIGNED_URL_STALE_TIME_MS = 50 * 60 * 1000;
const SIGNED_URL_GC_TIME_MS = 55 * 60 * 1000;

export const profileImageKeys = {
  all: ['profile-images'] as const,
  signedUrl: (imagePath: string) => ['profile-images', 'signed-url', imagePath] as const,
};

/**
 * Storage パスから非公開プロフィール画像の署名付き URL を取得する
 */
export function useProfileImageUrl(imagePath: string | null | undefined) {
  return useQuery<string>({
    queryKey: profileImageKeys.signedUrl(imagePath ?? ''),
    queryFn: () => {
      if (!imagePath) {
        throw new Error('プロフィール画像のパスが未指定です');
      }
      return profileImageStorageRepository.getSignedProfileImageUrl(imagePath);
    },
    enabled: Boolean(imagePath),
    staleTime: SIGNED_URL_STALE_TIME_MS,
    gcTime: SIGNED_URL_GC_TIME_MS,
    refetchInterval: SIGNED_URL_STALE_TIME_MS,
  });
}

/**
 * プロフィール画像を選んで縮小圧縮し、Supabase Storage へアップロードするミューテーション
 */
export function useUploadProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: UploadProfileImageUseCaseInput) => uploadProfileImage(input),
    onSuccess: (result, variables) => {
      if (!result) {
        return;
      }
      if (
        variables?.updateProfileRecord !== false &&
        variables?.previousImagePath &&
        variables.previousImagePath !== result.imagePath
      ) {
        queryClient.removeQueries({
          queryKey: profileImageKeys.signedUrl(variables.previousImagePath),
          exact: true,
        });
      }
      void queryClient.invalidateQueries({
        queryKey: profileImageKeys.signedUrl(result.imagePath),
        exact: true,
      });
    },
  });
}

/**
 * プロフィール画像を解除し、Storage 上のファイルを削除するミューテーション
 */
export function useRemoveProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RemoveProfileImageUseCaseInput) => removeProfileImage(input),
    onSuccess: (_result, variables) => {
      if (variables.currentImagePath) {
        queryClient.removeQueries({
          queryKey: profileImageKeys.signedUrl(variables.currentImagePath),
          exact: true,
        });
      }
    },
  });
}
