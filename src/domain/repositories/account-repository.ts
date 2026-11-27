// アカウント登録のためのリポジトリ（profiles の作成は #16 でここに足す）
export type AccountRepository = {
  /** 公開 ID が自分以外の人に使われているか（完全一致） */
  isPublicIdTaken(publicId: string): Promise<boolean>;
};
