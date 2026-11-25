import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PLACE_RADIUS_OPTIONS, type PlaceRadius } from '@/domain/entities/island';
import { ThemedText } from '@/presentation/components/themed-text';
import { PLACE_RADIUS_LABELS } from '@/presentation/constants/island';
import { Spacing } from '@/presentation/constants/theme';

type PlaceRadiusSelectorProps = {
  placeLabel: string;
  selectedRadius: PlaceRadius;
  onSelect: (radius: PlaceRadius) => void;
};

/**
 * 登録場所の判定半径（100m / 200m / 500m）を選択するセクション
 */
export function PlaceRadiusSelector({
  placeLabel,
  selectedRadius,
  onSelect,
}: PlaceRadiusSelectorProps) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{placeLabel}とみなす範囲（半径）</ThemedText>
      <View style={styles.radiusRow}>
        {PLACE_RADIUS_OPTIONS.map((option) => {
          const selected = option === selectedRadius;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(option)}
              style={[styles.radiusButton, selected && styles.radiusButtonActive]}
            >
              <ThemedText type="smallBold" style={selected ? styles.radiusTextActive : undefined}>
                {PLACE_RADIUS_LABELS[option].label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
