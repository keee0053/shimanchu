import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { IslandType } from '@/domain/entities/island';
import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { ISLAND_LABELS } from '@/presentation/constants/island';
import { Spacing } from '@/presentation/constants/theme';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatUpdatedAt(isoString: string | null, now: Date = new Date()): string {
  if (!isoString) {
    return '未判定';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '未判定';
  }

  const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  if (date.getFullYear() !== now.getFullYear()) {
    return `${date.getFullYear()}/${monthDay} ${time}`;
  }
  return `${monthDay} ${time}`;
}

type CurrentIslandCardProps = {
  displayedIsland: IslandType | null;
  lastUpdatedAt: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
};

/**
 * 現在の島の状態・最終判定時刻と手動更新ボタンを表示するカード
 */
export function CurrentIslandCard({
  displayedIsland,
  lastUpdatedAt,
  isRefreshing,
  onRefresh,
}: CurrentIslandCardProps) {
  const islandInfo = displayedIsland ? ISLAND_LABELS[displayedIsland] : null;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.statusHeader}>
        <View style={styles.statusTextBlock}>
          <ThemedText type="small" themeColor="textSecondary">
            現在の島の状態
          </ThemedText>
          <ThemedText type="smallBold" style={styles.statusTitle}>
            {islandInfo ? islandInfo.label : '判定中...'}
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isRefreshing}
          onPress={onRefresh}
          style={({ pressed }) => [
            styles.refreshButton,
            isRefreshing && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText type="smallBold" style={styles.refreshButtonText}>
            {isRefreshing ? '更新中...' : '今すぐ更新'}
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {islandInfo ? islandInfo.description : 'フォアグラウンドで位置情報を取得して島を判定します'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        最終判定時刻: {formatUpdatedAt(lastUpdatedAt)} / 端末内のみに座標を保存
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 16,
    gap: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  statusTextBlock: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
