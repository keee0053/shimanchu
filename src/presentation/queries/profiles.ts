import { profileRepository } from '@/container';
import type { UpdateProfileInput } from '@/domain/entities/profile';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const profileKeys = {
  all: ['profiles'] as const,
  detail: (userId: string) => ['profiles', userId] as const,
};

export function useProfile(userId: string) {
  return useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => profileRepository.findById(userId),
    enabled: Boolean(userId),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateProfileInput }) =>
      profileRepository.save(userId, input),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
    },
  });
}
