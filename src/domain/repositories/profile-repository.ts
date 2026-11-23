import type { Profile, UpdateProfileInput } from '../entities/profile';

export type ProfileRepository = {
  findById(userId: string): Promise<Profile | null>;
  save(userId: string, input: UpdateProfileInput): Promise<void>;
};
