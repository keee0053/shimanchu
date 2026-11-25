import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  PLACE_ISLAND_TYPES,
  type PlaceIslandType,
  type RegisteredPlaces,
} from '@/domain/entities/island';
import { ThemedText } from '@/presentation/components/themed-text';
import { PLACE_ISLAND_LABELS } from '@/presentation/constants/island';
import { Spacing } from '@/presentation/constants/theme';

type PlaceTypeTabsProps = {
  selectedType: PlaceIslandType;
  savedPlaces: RegisteredPlaces | undefined;
  onSelect: (type: PlaceIslandType) => void;
};

/**
 * 家・学校の登録対象を切り替えるタブバー
 */
export function PlaceTypeTabs({ selectedType, savedPlaces, onSelect }: PlaceTypeTabsProps) {
  return (
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
            onPress={() => onSelect(type)}
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
  );
}

const styles = StyleSheet.create({
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
});
