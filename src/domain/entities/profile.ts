export const BIRTH_DATE_VISIBILITIES = ['full', 'age', 'hidden'] as const;
export type BirthDateVisibility = (typeof BIRTH_DATE_VISIBILITIES)[number];

export const GENDERS = ['male', 'female', 'other', 'unspecified'] as const;
export type Gender = (typeof GENDERS)[number];

export const PROFILE_RULES = {
  PUBLIC_ID_MIN_LENGTH: 4,
  PUBLIC_ID_MAX_LENGTH: 20,
  PUBLIC_ID_PATTERN: /^[a-z0-9]{4,20}$/,
  DISPLAY_NAME_MIN_LENGTH: 1,
  DISPLAY_NAME_MAX_LENGTH: 20,
  BIO_MAX_LENGTH: 100,
  MIN_AGE_YEARS: 18,
  MAX_AGE_YEARS: 120,
} as const;

export type Profile = {
  id: string;
  publicId: string;
  displayName: string;
  bio: string | null;
  birthDate: string | null;
  birthDateVisibility: BirthDateVisibility;
  gender: Gender;
  discoverable: boolean;
};

export type UpdateProfileInput = {
  publicId: string;
  displayName: string;
  bio: string | null;
  birthDate: string;
  birthDateVisibility: BirthDateVisibility;
  gender: Gender;
  discoverable: boolean;
};
