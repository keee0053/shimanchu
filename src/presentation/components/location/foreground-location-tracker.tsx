import { useForegroundLocationSync } from '@/presentation/hooks/use-foreground-location-sync';

/**
 * アプリのフォアグラウンド位置情報同期を起動する非表示コンポーネント
 */
export function ForegroundLocationTracker() {
  useForegroundLocationSync();
  return null;
}
