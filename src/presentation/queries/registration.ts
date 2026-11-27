import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountRepository } from '@/container';
import type { AvatarConfig } from '@/domain/entities/avatar';
import type { RegistrationDraft } from '@/domain/entities/registration';

import { avatarKeys } from './avatar';

/**
 * 公開 ID が他の人に使われているかを確かめる（フォームの送信時に1回だけ呼ぶのでミューテーションにする）
 */
export function useCheckPublicIdTaken() {
  return useMutation({
    mutationFn: (publicId: string) => accountRepository.isPublicIdTaken(publicId),
  });
}

/** 入力したプロフィールとアバターで、アカウントを登録する（profiles の行を作る） */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { draft: RegistrationDraft; avatarConfig: AvatarConfig }) =>
      accountRepository.register(input.draft, input.avatarConfig),
    onSuccess: (result, input) => {
      if (result.ok) {
        queryClient.setQueryData(avatarKeys.mine(), input.avatarConfig);
      }
    },
  });
}
