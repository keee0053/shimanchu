import { resolveDisplayedIsland } from '@/domain/services/island';
import { useMyPresence } from '@/presentation/queries/presence';
import { usePresenceEvaluationStore } from '@/presentation/stores/presence-evaluation-store';

/**
 * 端末内の最新判定結果とサーバーの user_presence、および24時間未更新ルールから
 * 画面に表示する現在の島と最終判定時刻を決定するフック
 */
export function useDisplayedIsland() {
  const latestEvaluation = usePresenceEvaluationStore((s) => s.latestEvaluation);
  const myPresenceQuery = useMyPresence();
  const serverPresence = myPresenceQuery.data;

  const rawIsland = latestEvaluation?.islandType ?? serverPresence?.islandType ?? null;
  const lastUpdatedAt = latestEvaluation?.updatedAt ?? serverPresence?.updatedAt ?? null;
  const displayedIsland =
    rawIsland && lastUpdatedAt ? resolveDisplayedIsland(rawIsland, lastUpdatedAt) : rawIsland;

  return { displayedIsland, lastUpdatedAt };
}
