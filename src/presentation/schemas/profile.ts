import { PROFILE_RULES } from '@/domain/entities/profile';
import { z } from 'zod';

export const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(1, '表示名を入力してください')
    .max(
      PROFILE_RULES.DISPLAY_NAME_MAX_LENGTH,
      `${PROFILE_RULES.DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください`,
    ),
  university: z
    .string()
    .max(
      PROFILE_RULES.UNIVERSITY_MAX_LENGTH,
      `${PROFILE_RULES.UNIVERSITY_MAX_LENGTH}文字以内で入力してください`,
    )
    .optional(),
  faculty: z
    .string()
    .max(
      PROFILE_RULES.FACULTY_MAX_LENGTH,
      `${PROFILE_RULES.FACULTY_MAX_LENGTH}文字以内で入力してください`,
    )
    .optional(),
  year: z
    .string()
    .optional()
    .refine((val) => !val || (/^\d+$/.test(val) && Number(val) >= 1 && Number(val) <= 6), {
      message: '学年は1〜6の数字で入力してください',
    }),
  bio: z
    .string()
    .max(PROFILE_RULES.BIO_MAX_LENGTH, `${PROFILE_RULES.BIO_MAX_LENGTH}文字以内で入力してください`)
    .optional(),
  birthday: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'YYYY-MM-DD の形式で入力してください')
    .optional(),
  gender: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
