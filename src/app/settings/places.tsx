import React, { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  type Coordinates,
  DEFAULT_PLACE_RADIUS,
  PLACE_ISLAND_TYPES,
  PLACE_RADIUS_OPTIONS,
  type PlaceIslandType,
  type PlaceRadius,
} from '@/domain/entities/island';
import { resolveDisplayedIsland } from '@/domain/services/island';
import { PlaceMapPicker } from '@/presentation/components/location/place-map-picker';
import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import {
  ISLAND_LABELS,
  PLACE_ISLAND_LABELS,
  PLACE_RADIUS_LABELS,
} from '@/presentation/constants/island';
import { Spacing } from '@/presentation/constants/theme';
import {
  useCurrentPositionForRegistration,
  useRegisteredPlaces,
  useRemoveRegisteredPlace,
  useSaveRegisteredPlace,
} from '@/presentation/queries/places';
import {
  useLatestPresenceEvaluation,
  useMyPresence,
  useUpdateMyLocation,
} from '@/presentation/queries/presence';
import { formatUpdatedAt } from '@/presentation/utils/format-updated-at';

type PlaceDraft = {
  coordinates: Coordinates | null;
  radius: PlaceRadius;
  version: number;
};

export default function PlacesSettingsScreen() {
  const [selectedType, setSelectedType] = useState<PlaceIslandType>('home');
  const [drafts, setDrafts] = useState<Partial<Record<PlaceIslandType, PlaceDraft>>>({});
  const draftVersionRef = useRef(0);
  const [focusVersion, setFocusVersion] = useState(0);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const placesQuery = useRegisteredPlaces();
  const myPresenceQuery = useMyPresence();
  const latestEvaluationQuery = useLatestPresenceEvaluation();

  const updateLocationMutation = useUpdateMyLocation();
  const currentPositionMutation = useCurrentPositionForRegistration();
  const savePlaceMutation = useSaveRegisteredPlace();
  const removePlaceMutation = useRemoveRegisteredPlace();

  const savedPlaces = placesQuery.data;
  const savedPlaceForTab = savedPlaces?.[selectedType] ?? null;
  const currentDraft = drafts[selectedType];
  const draftCoords =
    currentDraft !== undefined ? currentDraft.coordinates : (savedPlaceForTab?.coordinates ?? null);
  const draftRadius =
    currentDraft !== undefined
      ? currentDraft.radius
      : (savedPlaceForTab?.radius ?? DEFAULT_PLACE_RADIUS);

  const latestEval = latestEvaluationQuery.data;
  const serverPresence = myPresenceQuery.data;
  const rawIsland = latestEval?.islandType ?? serverPresence?.islandType ?? null;
  const lastUpdatedAt = latestEval?.updatedAt ?? serverPresence?.updatedAt ?? null;
  const displayedIsland =
    rawIsland && lastUpdatedAt ? resolveDisplayedIsland(rawIsland, lastUpdatedAt) : rawIsland;
  const islandInfo = displayedIsland ? ISLAND_LABELS[displayedIsland] : null;
  const tabMeta = PLACE_ISLAND_LABELS[selectedType];

  const updateDraft = (patch: Partial<Omit<PlaceDraft, 'version'>>) => {
    draftVersionRef.current += 1;
    const nextVersion = draftVersionRef.current;
    setDrafts((prev) => {
      const base = prev[selectedType] ?? {
        coordinates: savedPlaceForTab?.coordinates ?? null,
        radius: savedPlaceForTab?.radius ?? DEFAULT_PLACE_RADIUS,
        version: nextVersion,
      };
      return {
        ...prev,
        [selectedType]: {
          ...base,
          ...patch,
          version: nextVersion,
        },
      };
    });
  };

  const clearDraftIfUnchanged = (type: PlaceIslandType, expectedVersion: number | undefined) => {
    setDrafts((prev) => {
      if (!(type in prev) || prev[type]?.version !== expectedVersion) {
        return prev;
      }
      const next = { ...prev };
      delete next[type];
      return next;
    });
  };

  const handleSelectTab = (type: PlaceIslandType) => {
    setSelectedType(type);
    setActionMessage(null);
    setPermissionNotice(null);
    if (drafts[type]?.coordinates || savedPlaces?.[type]?.coordinates) {
      setFocusVersion((v) => v + 1);
    }
  };

  const handleRefreshIsland = async () => {
    setPermissionNotice(null);
    setActionMessage(null);
    try {
      const result = await updateLocationMutation.mutateAsync({
        currentIsland: displayedIsland,
      });
      if (result.islandType === 'drifting') {
        setPermissionNotice(
          '位置情報を取得できない、または権限が許可されていないため「漂流中」として判定しました。',
        );
      }
    } catch {
      setPermissionNotice(
        '位置判定の更新に失敗しました。通信環境をご確認のうえ再試行してください。',
      );
    }
  };

  const handleFetchCurrentPosition = async () => {
    setPermissionNotice(null);
    setActionMessage(null);
    try {
      const coords = await currentPositionMutation.mutateAsync();
      if (!coords) {
        setPermissionNotice(
          '現在地を取得できませんでした。位置情報の権限または端末の位置情報設定をご確認ください。',
        );
        return;
      }
      updateDraft({ coordinates: coords });
      setFocusVersion((v) => v + 1);
      setActionMessage('現在地にピンを置きました。必要なら地図上で微調整して保存してください。');
    } catch {
      setPermissionNotice(
        '現在地を取得できませんでした。位置情報の権限または端末の位置情報設定をご確認ください。',
      );
    }
  };

  const handleSavePlace = async () => {
    if (!draftCoords) {
      return;
    }
    setPermissionNotice(null);
    setActionMessage(null);
    const targetType = selectedType;
    const targetLabel = PLACE_ISLAND_LABELS[targetType].label;
    const targetVersion = drafts[targetType]?.version;

    try {
      const { evaluation, syncFailed } = await savePlaceMutation.mutateAsync({
        type: targetType,
        place: {
          coordinates: draftCoords,
          radius: draftRadius,
        },
      });
      clearDraftIfUnchanged(targetType, targetVersion);
      if (syncFailed || !evaluation) {
        setPermissionNotice(
          `${targetLabel}を端末に保存しましたが、現在の島の同期に失敗しました。「今すぐ更新」から再試行してください。`,
        );
        return;
      }
      setActionMessage(
        `${targetLabel}を端末に保存しました（現在の判定: ${ISLAND_LABELS[evaluation.islandType].label}）。`,
      );
    } catch {
      setPermissionNotice(`${targetLabel}の保存に失敗しました。もう一度お試しください。`);
    }
  };

  const handleRemovePlace = () => {
    const targetType = selectedType;
    const targetLabel = PLACE_ISLAND_LABELS[targetType].label;
    Alert.alert(
      `${targetLabel}の登録を解除しますか？`,
      '端末に保存されている位置情報を削除します。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '解除する',
          style: 'destructive',
          onPress: async () => {
            setPermissionNotice(null);
            setActionMessage(null);
            const targetVersion = drafts[targetType]?.version;
            try {
              const { evaluation, syncFailed } = await removePlaceMutation.mutateAsync(targetType);
              clearDraftIfUnchanged(targetType, targetVersion);
              if (syncFailed || !evaluation) {
                setPermissionNotice(
                  `${targetLabel}の登録を解除しましたが、現在の島の同期に失敗しました。「今すぐ更新」から再試行してください。`,
                );
                return;
              }
              setActionMessage(
                `${targetLabel}の登録を解除しました（現在の判定: ${ISLAND_LABELS[evaluation.islandType].label}）。`,
              );
            } catch {
              setPermissionNotice(`${targetLabel}の解除に失敗しました。もう一度お試しください。`);
            }
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {/* 現在の島ステータス */}
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
              disabled={updateLocationMutation.isPending}
              onPress={() => void handleRefreshIsland()}
              style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
            >
              <ThemedText type="smallBold" style={styles.refreshButtonText}>
                {updateLocationMutation.isPending ? '更新中...' : '今すぐ更新'}
              </ThemedText>
            </Pressable>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {islandInfo
              ? islandInfo.description
              : 'フォアグラウンドで位置情報を取得して島を判定します'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            最終判定時刻: {formatUpdatedAt(lastUpdatedAt)} / 端末内のみに座標を保存
          </ThemedText>
        </ThemedView>

        {/* 家・学校の切り替えタブ */}
        <View style={styles.tabRow}>
          {PLACE_ISLAND_TYPES.map((type) => {
            const active = type === selectedType;
            const label = PLACE_ISLAND_LABELS[type].label;
            const registered = Boolean(savedPlaces?.[type]);
            return (
              <Pressable
                key={type}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => handleSelectTab(type)}
                style={[styles.tabButton, active && styles.tabButtonActive]}
              >
                <ThemedText
                  type="smallBold"
                  style={active ? styles.tabTextActive : styles.tabTextInactive}
                >
                  {label}（{registered ? '登録済み' : '未登録'}）
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* 現在地取得ボタン */}
        <Pressable
          accessibilityRole="button"
          disabled={currentPositionMutation.isPending}
          onPress={() => void handleFetchCurrentPosition()}
          style={({ pressed }) => [styles.gpsButton, pressed && styles.pressed]}
        >
          <ThemedText type="smallBold" style={styles.gpsButtonText}>
            {currentPositionMutation.isPending
              ? '現在地を取得しています...'
              : '現在地を取得してピンを置く'}
          </ThemedText>
        </Pressable>

        {permissionNotice && (
          <ThemedView type="backgroundElement" style={styles.noticeBox}>
            <ThemedText type="small">{permissionNotice}</ThemedText>
          </ThemedView>
        )}

        {actionMessage && (
          <ThemedView type="backgroundElement" style={styles.noticeBox}>
            <ThemedText type="small">{actionMessage}</ThemedText>
          </ThemedView>
        )}

        {/* 地図でピン移動 */}
        <PlaceMapPicker
          coordinates={draftCoords}
          radius={draftRadius}
          accentColor={tabMeta.accentColor}
          fillColor={tabMeta.fillColor}
          focusVersion={focusVersion}
          onChangeCoordinates={(coords) => {
            updateDraft({ coordinates: coords });
            setActionMessage(null);
          }}
        />

        {/* 半径選択（100m / 200m / 500m） */}
        <View style={styles.section}>
          <ThemedText type="smallBold">{tabMeta.label}とみなす範囲（半径）</ThemedText>
          <View style={styles.radiusRow}>
            {PLACE_RADIUS_OPTIONS.map((option) => {
              const selected = option === draftRadius;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => updateDraft({ radius: option })}
                  style={[styles.radiusButton, selected && styles.radiusButtonActive]}
                >
                  <ThemedText
                    type="smallBold"
                    style={selected ? styles.radiusTextActive : undefined}
                  >
                    {PLACE_RADIUS_LABELS[option].label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 保存・解除ボタン */}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={!draftCoords || savePlaceMutation.isPending}
            onPress={() => void handleSavePlace()}
            style={({ pressed }) => [
              styles.saveButton,
              (!draftCoords || savePlaceMutation.isPending) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <ThemedText type="smallBold" style={styles.saveButtonText}>
              {savePlaceMutation.isPending ? '保存中...' : `${tabMeta.label}の場所を保存`}
            </ThemedText>
          </Pressable>

          {savedPlaceForTab && (
            <Pressable
              accessibilityRole="button"
              disabled={removePlaceMutation.isPending}
              onPress={handleRemovePlace}
              style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
            >
              <ThemedText type="smallBold" style={styles.removeButtonText}>
                {tabMeta.label}の登録を解除
              </ThemedText>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
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
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.14)',
  },
  tabButtonActive: {
    backgroundColor: '#0F172A',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextInactive: {
    opacity: 0.75,
  },
  gpsButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  gpsButtonText: {
    color: '#FFFFFF',
  },
  noticeBox: {
    padding: Spacing.three,
    borderRadius: 12,
  },
  section: {
    gap: Spacing.two,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  radiusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(128, 128, 128, 0.25)',
  },
  radiusButtonActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  radiusTextActive: {
    color: '#0284C7',
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  saveButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  removeButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  removeButtonText: {
    color: '#DC2626',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
