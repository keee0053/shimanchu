import { create } from 'zustand';

// 仮の画面の振り分け（#18）。ログインとプロフィールの有無による本当の振り分けは #21 で作り、このストアは削除する
//   login: 未ログイン → ログイン画面
//   onboarding: ログイン済み・プロフィールなし → 初回設定
//   ready: プロフィールあり → タブ
export type TemporaryFlowStep = 'login' | 'onboarding' | 'ready';

type TemporaryFlowState = {
  step: TemporaryFlowStep;
  setStep: (step: TemporaryFlowStep) => void;
};

export const useTemporaryFlowStore = create<TemporaryFlowState>((set) => ({
  step: 'login',
  setStep: (step) => set({ step }),
}));
