import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Coordinates, PlaceIslandType } from '@/domain/entities/island';
import { CurrentIslandCard } from '@/presentation/components/location/current-island-card';
import { NoticeBox } from '@/presentation/components/location/notice-box';
import { PlaceMapPicker } from '@/presentation/components/location/place-map-picker';
import { PlaceRadiusSelector } from '@/presentation/components/location/place-radius-selector';
import { PlaceTypeTabs } from '@/presentation/components/location/place-type-tabs';
import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { ISLAND_LABELS, PLACE_ISLAND_LABELS } from '@/presentation/constants/island';
import { Spacing } from '@/presentation/constants/theme';
import { useDisplayedIsland } from '@/presentation/hooks/use-displayed-island';
import { usePlaceDrafts } from '@/presentation/hooks/use-place-drafts';
import {
  useCurrentPositionForRegistration,
  useRegisteredPlaces,
  useRemoveRegisteredPlace,
  useSaveRegisteredPlace,
} from '@/presentation/queries/places';
import { useUpdateMyLocation } from '@/presentation/queries/presence';

const CURRENT_POSITION_ERROR_MESSAGE =
  '現在地を取得できませんでした。位置情報の権限または端末の位置情報設定をご確認ください。';

function buildSyncFailedNotice(actionSummary: string): string {
  return `${actionSummary}が、現在の島の同期に失敗しました。「今すぐ更新」から再試行してください。`;
}

export default function PlacesSettingsScreen() {
  const [selectedType, setSelectedType] = useState<PlaceIslandType>('home');
  const [focusVersion, setFocusVersion] = useState(0);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const placesQuery = useRegisteredPlaces();
  const { displayedIsland, lastUpdatedAt } = useDisplayedIsland();

  const updateLocationMutation = useUpdateMyLocation();
  const currentPositionMutation = useCurrentPositionForRegistration();
  const savePlaceMutation = useSaveRegisteredPlace();
  const removePlaceMutation = useRemoveRegisteredPlace();

  const savedPlaces = placesQuery.data;
  const {
    savedPlaceForTab,
    draftCoords,
    draftRadius,
    updateDraft,
    clearDraftIfUnchanged,
    getDraftVersion,
    hasLocationForType,
  } = usePlaceDrafts(selectedType, savedPlaces);

  const isAndroid = Platform.OS === 'android';
  const isWeb = Platform.OS === 'web';
  const isFetchingCurrentPosition =
    currentPositionMutation.isPending || (isAndroid && savePlaceMutation.isPending);
  const gpsButtonLabel = isAndroid
    ? isFetchingCurrentPosition
      ? '現在地を登録しています...'
      : '現在地を登録する'
    : isWeb
      ? isFetchingCurrentPosition
        ? '現在地を取得しています...'
        : '現在地を取得'
      : isFetchingCurrentPosition
        ? '現在地を取得しています...'
        : '現在地を取得してピンを置く';

  const tabMeta = PLACE_ISLAND_LABELS[selectedType];

  const clearFeedback = () => {
    setPermissionNotice(null);
    setActionMessage(null);
  };

  const handleSelectTab = (type: PlaceIslandType) => {
    setSelectedType(type);
    clearFeedback();
    if (hasLocationForType(type)) {
      setFocusVersion((v) => v + 1);
    }
  };

  const handleRefreshIsland = async () => {
    clearFeedback();
    try {
      const result = await updateLocationMutation.mutateAsync({ requestPermission: true });
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
    clearFeedback();
    const targetType = selectedType;
    const targetRadius = draftRadius;
    const targetLabel = PLACE_ISLAND_LABELS[targetType].label;
    const targetVersion = getDraftVersion(targetType);

    let coords: Coordinates | null;
    try {
      coords = await currentPositionMutation.mutateAsync();
    } catch {
      setPermissionNotice(CURRENT_POSITION_ERROR_MESSAGE);
      return;
    }

    if (!coords) {
      setPermissionNotice(CURRENT_POSITION_ERROR_MESSAGE);
      return;
    }

    if (isAndroid) {
      try {
        const { evaluation, syncFailed } = await savePlaceMutation.mutateAsync({
          type: targetType,
          place: {
            coordinates: coords,
            radius: targetRadius,
          },
          coords,
          onPlacesCommitted: () => {
            clearDraftIfUnchanged(targetType, targetVersion);
          },
        });
        if (syncFailed || !evaluation) {
          setPermissionNotice(buildSyncFailedNotice(`${targetLabel}を端末に保存しました`));
          return;
        }
        setActionMessage(
          `${targetLabel}を現在地で端末に保存しました（現在の判定: ${ISLAND_LABELS[evaluation.islandType].label}）。`,
        );
      } catch {
        setPermissionNotice(`${targetLabel}の保存に失敗しました。もう一度お試しください。`);
      }
      return;
    }

    updateDraft({ coordinates: coords });
    setFocusVersion((v) => v + 1);
    setActionMessage(
      isWeb
        ? '現在地を取得しました。下のボタンから保存できます。'
        : '現在地にピンを置きました。必要なら地図上で微調整して保存してください。',
    );
  };

  const handleSavePlace = async () => {
    if (!draftCoords) {
      return;
    }
    clearFeedback();
    const targetType = selectedType;
    const targetLabel = PLACE_ISLAND_LABELS[targetType].label;
    const targetVersion = getDraftVersion(targetType);

    try {
      const { evaluation, syncFailed } = await savePlaceMutation.mutateAsync({
        type: targetType,
        place: {
          coordinates: draftCoords,
          radius: draftRadius,
        },
        onPlacesCommitted: () => {
          clearDraftIfUnchanged(targetType, targetVersion);
        },
      });
      if (syncFailed || !evaluation) {
        setPermissionNotice(buildSyncFailedNotice(`${targetLabel}を端末に保存しました`));
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
    if (isWeb) {
      return;
    }
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
            clearFeedback();
            const targetVersion = getDraftVersion(targetType);
            try {
              const { evaluation, syncFailed } = await removePlaceMutation.mutateAsync({
                type: targetType,
                onPlacesCommitted: () => {
                  clearDraftIfUnchanged(targetType, targetVersion);
                },
              });
              if (syncFailed || !evaluation) {
                setPermissionNotice(buildSyncFailedNotice(`${targetLabel}の登録を解除しました`));
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
        <CurrentIslandCard
          displayedIsland={displayedIsland}
          lastUpdatedAt={lastUpdatedAt}
          isRefreshing={updateLocationMutation.isPending}
          onRefresh={() => void handleRefreshIsland()}
        />

        <PlaceTypeTabs
          selectedType={selectedType}
          savedPlaces={savedPlaces}
          onSelect={handleSelectTab}
        />

        <Pressable
          accessibilityRole="button"
          disabled={isFetchingCurrentPosition}
          onPress={() => void handleFetchCurrentPosition()}
          style={({ pressed }) => [
            styles.gpsButton,
            isFetchingCurrentPosition && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText type="smallBold" style={styles.gpsButtonText}>
            {gpsButtonLabel}
          </ThemedText>
        </Pressable>

        {permissionNotice && <NoticeBox message={permissionNotice} />}
        {actionMessage && <NoticeBox message={actionMessage} />}

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

        <PlaceRadiusSelector
          placeLabel={tabMeta.label}
          selectedRadius={draftRadius}
          onSelect={(radius) => updateDraft({ radius })}
        />

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

          {!isWeb && savedPlaceForTab && (
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
  gpsButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  gpsButtonText: {
    color: '#FFFFFF',
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
