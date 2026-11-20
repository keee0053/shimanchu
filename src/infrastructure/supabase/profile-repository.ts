import type { Profile, UpdateProfileInput } from '@/domain/entities/profile';
import type { ProfileRepository } from '@/domain/repositories/profile-repository';
import { supabase } from './client';

export const supabaseProfileRepository: ProfileRepository = {
  async findById(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, university, faculty, year, bio, birthday, gender')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      displayName: data.display_name,
      university: data.university,
      faculty: data.faculty,
      year: data.year,
      bio: data.bio,
      birthday: data.birthday,
      gender: data.gender,
    };
  },

  async save(userId: string, input: UpdateProfileInput): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: input.displayName,
        university: input.university ?? null,
        faculty: input.faculty ?? null,
        year: input.year ?? null,
        bio: input.bio ?? null,
        birthday: input.birthday ?? null,
        gender: input.gender ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  },
};