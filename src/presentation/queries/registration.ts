import { useMutation } from '@tanstack/react-query';

import { accountRepository } from '@/container';

/**
 * 公開 ID が他の人に使われているかを確かめる（フォームの送信時に1回だけ呼ぶのでミューテーションにする）
 */
export function useCheckPublicIdTaken() {
  return useMutation({
    mutationFn: (publicId: string) => accountRepository.isPublicIdTaken(publicId),
  });
}
