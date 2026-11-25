import { create } from 'zustand';

import type { UpdateMyLocationResult } from '@/application/update-my-location';

type PresenceEvaluationState = {
  latestEvaluation: UpdateMyLocationResult | null;
  setLatestEvaluation: (evaluation: UpdateMyLocationResult) => void;
  clearLatestEvaluation: () => void;
};

/**
 * 端末内で判定した直近の島ステータス（未ログイン時も画面で確認できるよう Zustand で保持）
 */
export const usePresenceEvaluationStore = create<PresenceEvaluationState>((set) => ({
  latestEvaluation: null,
  setLatestEvaluation: (evaluation) => set({ latestEvaluation: evaluation }),
  clearLatestEvaluation: () => set({ latestEvaluation: null }),
}));
