import { BIRTH_DATE_VISIBILITIES, GENDERS, PROFILE_RULES } from '@/domain/entities/profile';
import { isBirthDateInAllowedRange, parseIsoDate } from '@/domain/services/birth-date';
import { z } from 'zod';

export const profileFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(PROFILE_RULES.DISPLAY_NAME_MIN_LENGTH, '表示名を入力してください')
    .max(
      PROFILE_RULES.DISPLAY_NAME_MAX_LENGTH,
      `${PROFILE_RULES.DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください`,
    ),
  publicId: z
    .string()
    .trim()
    .regex(
      PROFILE_RULES.PUBLIC_ID_PATTERN,
      `公開 ID は半角英小文字と数字の${PROFILE_RULES.PUBLIC_ID_MIN_LENGTH}〜${PROFILE_RULES.PUBLIC_ID_MAX_LENGTH}文字で入力してください`,
    ),
  bio: z
    .string()
    .max(PROFILE_RULES.BIO_MAX_LENGTH, `${PROFILE_RULES.BIO_MAX_LENGTH}文字以内で入力してください`),
  birthDate: z
    .string()
    .trim()
    .min(1, '生年月日を入力してください')
    .refine((val) => parseIsoDate(val) !== null, {
      message: 'YYYY-MM-DD の有効な日付で入力してください',
    })
    .refine((val) => isBirthDateInAllowedRange(val), {
      message: `生年月日は${PROFILE_RULES.MIN_AGE_YEARS}歳以上${PROFILE_RULES.MAX_AGE_YEARS}歳以下の日付で入力してください`,
    }),
  birthDateVisibility: z.enum(BIRTH_DATE_VISIBILITIES),
  gender: z.enum(GENDERS),
  discoverable: z.boolean(),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
