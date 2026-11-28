import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { avatarRepository } from '@/container';
import type { AvatarConfig } from '@/domain/entities/avatar';

export const avatarKeys = {
  all: ['avatar'] as const,
  mine: () => ['avatar', 'mine'] as const,
};

/** 自分のアバター設定（profiles の行がまだなければ null） */
export function useMyAvatarConfig() {
  return useQuery({
    queryKey: avatarKeys.mine(),
    queryFn: () => avatarRepository.findMine(),
  });
}

/** 自分のアバター設定を保存する（2回目以降の編集） */
export function useUpdateMyAvatarConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: AvatarConfig) => avatarRepository.updateMine(config),
    onSuccess: (_result, config) => {
      queryClient.setQueryData(avatarKeys.mine(), config);
    },
  });
}
