import { create } from 'zustand';

import type { RegistrationDraft } from '@/domain/entities/registration';

type RegistrationDraftState = {
  draft: RegistrationDraft | null;
  setDraft: (draft: RegistrationDraft) => void;
  clearDraft: () => void;
};

/**
 * アカウント登録で入力したプロフィール。
 * profiles の行はアバター作成の最後にまとめて1回で作る（#16）ため、それまでは端末のメモリにだけ持つ。
 * 生年月日を含むので端末のストレージには書かない（アプリを閉じたら入力し直す）
 */
export const useRegistrationDraftStore = create<RegistrationDraftState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
