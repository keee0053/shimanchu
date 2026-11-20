export const PROFILE_RULES = {
  DISPLAY_NAME_MAX_LENGTH: 30,
  UNIVERSITY_MAX_LENGTH: 50,
  FACULTY_MAX_LENGTH: 50,
  BIO_MAX_LENGTH: 300,
} as const;

export type Profile = {
  id: string;
  displayName: string;
  university: string | null;
  faculty: string | null;
  year: number | null;
  bio: string | null;
  birthday: string | null;
  gender: string | null;
};

export type UpdateProfileInput = {
  displayName: string;
  university?: string;
  faculty?: string;
  year?: number;
  bio?: string;
  birthday?: string;
  gender?: string;
};
