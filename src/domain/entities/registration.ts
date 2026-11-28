// アカウント登録（初回のプロフィール設定 #22）
// 入力のルールは profiles テーブルの制約（public_id・display_name の CHECK、生年月日のトリガー）と同じにする

export const REGISTRATION_RULES = {
  DISPLAY_NAME_MAX_LENGTH: 20,
  PUBLIC_ID_MIN_LENGTH: 4,
  PUBLIC_ID_MAX_LENGTH: 20,
  PUBLIC_ID_PATTERN: /^[a-z0-9]{4,20}$/,
  /** 利用できる年齢の下限（#50） */
  MIN_AGE_YEARS: 18,
  /** 生年月日として入力できる最も古い年数 */
  MAX_AGE_YEARS: 120,
} as const;

/**
 * アカウント登録で入力する、profiles の作成に必須の項目。
 * アバター作成の最後に、アバターと一緒に1回で profiles に INSERT する（#16）までは端末の中だけに持つ。
 * 自己紹介・性別・画像・生年月日の公開範囲は DB の初期値のまま作り、あとからプロフィール編集で設定する
 */
export type RegistrationDraft = {
  displayName: string;
  publicId: string;
  /** YYYY-MM-DD */
  birthDate: string;
};
