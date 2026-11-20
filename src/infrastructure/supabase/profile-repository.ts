import {
  BIRTH_DATE_VISIBILITIES,
  GENDERS,
  type BirthDateVisibility,
  type Gender,
  type Profile,
  type UpdateProfileInput,
} from '@/domain/entities/profile';
import type { ProfileRepository } from '@/domain/repositories/profile-repository';
import { supabase } from './client';

function parseBirthDateVisibility(value: string): BirthDateVisibility {
  if ((BIRTH_DATE_VISIBILITIES as readonly string[]).includes(value)) {
    return value as BirthDateVisibility;
  }
  return 'age';
}

function parseGender(value: string): Gender {
  if ((GENDERS as readonly string[]).includes(value)) {
    return value as Gender;
  }
  return 'unspecified';
}

export const supabaseProfileRepository: ProfileRepository = {
  async findById(userId: string): Promise<Profile | null> {
    // profiles.birth_date は列単位 SELECT が取り消されているため、profile_birthdays ビューから取得する
    const [profileRes, birthdayRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, public_id, display_name, bio, birth_date_visibility, gender, discoverable')
        .eq('id', userId)
        .maybeSingle(),
      supabase.from('profile_birthdays').select('birth_date').eq('id', userId).maybeSingle(),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (birthdayRes.error) throw birthdayRes.error;
    if (!profileRes.data) return null;

    return {
      id: profileRes.data.id,
      publicId: profileRes.data.public_id,
      displayName: profileRes.data.display_name,
      bio: profileRes.data.bio,
      birthDate: birthdayRes.data?.birth_date ?? null,
      birthDateVisibility: parseBirthDateVisibility(profileRes.data.birth_date_visibility),
      gender: parseGender(profileRes.data.gender),
      discoverable: profileRes.data.discoverable,
    };
  },

  async save(userId: string, input: UpdateProfileInput): Promise<void> {
    // updated_at は列単位 UPDATE が許可されていないため含めない（トリガーで自動更新される）
    const { error } = await supabase
      .from('profiles')
      .update({
        public_id: input.publicId,
        display_name: input.displayName,
        bio: input.bio,
        birth_date: input.birthDate,
        birth_date_visibility: input.birthDateVisibility,
        gender: input.gender,
        discoverable: input.discoverable,
      })
      .eq('id', userId);

    if (error) throw error;
  },
};
