import type { AvatarConfig } from '../entities/avatar';
import type { RegistrationDraft } from '../entities/registration';

/**
 * アカウント登録の結果。
 * 公開 ID は入力画面で確かめているが、登録までの間にほかの人に使われることがあるため、結果で返す
 */
export type RegisterResult = { ok: true } | { ok: false; reason: 'public_id_taken' };

// アカウント登録のためのリポジトリ
export type AccountRepository = {
  /** 公開 ID が自分以外の人に使われているか（完全一致） */
  isPublicIdTaken(publicId: string): Promise<boolean>;
  /** 入力したプロフィールとアバターで、自分の profiles の行を1回で作る */
  register(draft: RegistrationDraft, avatarConfig: AvatarConfig): Promise<RegisterResult>;
};
