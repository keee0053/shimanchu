import { z } from 'zod';

import { REGISTRATION_RULES } from '@/domain/entities/registration';
import {
  getJstToday,
  isBirthDateInAllowedRange,
  parseIsoDate,
} from '@/domain/services/registration-birth-date';

const {
  DISPLAY_NAME_MAX_LENGTH,
  PUBLIC_ID_MIN_LENGTH,
  PUBLIC_ID_MAX_LENGTH,
  PUBLIC_ID_PATTERN,
  MIN_AGE_YEARS,
} = REGISTRATION_RULES;

/** アカウント登録（初回のプロフィール設定 #22）。profiles の作成に必須の項目と同意だけ */
export const registrationSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, '表示名を入力してください')
    .max(DISPLAY_NAME_MAX_LENGTH, `表示名は${DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください`),
  publicId: z
    .string()
    .trim()
    .min(1, '公開 ID を入力してください')
    .regex(
      PUBLIC_ID_PATTERN,
      `公開 ID は半角の英小文字か数字で${PUBLIC_ID_MIN_LENGTH}〜${PUBLIC_ID_MAX_LENGTH}文字にしてください`,
    ),
  birthDate: z
    .string()
    .min(1, '生年月日を選んでください')
    .superRefine((value, ctx) => {
      const parsed = parseIsoDate(value);
      if (!parsed) {
        ctx.addIssue({ code: 'custom', message: '生年月日を正しく選んでください' });
        return;
      }
      if (!isBirthDateInAllowedRange(parsed, getJstToday(new Date()))) {
        ctx.addIssue({
          code: 'custom',
          message: `しまんちゅは${MIN_AGE_YEARS}歳以上の方だけ利用できます`,
        });
      }
    }),
  agreedToTerms: z.boolean().refine((value) => value, {
    message: `${MIN_AGE_YEARS}歳以上であることと、利用規約・プライバシーポリシーへの同意が必要です`,
  }),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
