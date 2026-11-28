import type { AvatarConfig } from '../entities/avatar';
import type { RegistrationDraft } from '../entities/registration';

/**
 * アカウント登録の結果。
 * - public_id_taken: 公開 ID は入力画面で確かめているが、登録までの間にほかの人に使われることがある
 * - already_registered: 自分の行がもうある（通信が切れて送り直したときなど）。今回の入力は保存していない
 */
export type RegisterResult =
  { ok: true } | { ok: false; reason: 'public_id_taken' | 'already_registered' };

// アカウント登録のためのリポジトリ
export type AccountRepository = {
  /** 公開 ID が自分以外の人に使われているか（完全一致） */
  isPublicIdTaken(publicId: string): Promise<boolean>;
  /** 入力したプロフィールとアバターで、自分の profiles の行を1回で作る */
  register(draft: RegistrationDraft, avatarConfig: AvatarConfig): Promise<RegisterResult>;
};
