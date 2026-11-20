import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';

import type { PlaceMapPickerProps } from './place-map-picker-types';

/**
 * Web 環境向けのプレースホルダー表示（MVP は iOS / Android のみ対象）
 */
export function PlaceMapPicker({ coordinates, radius }: PlaceMapPickerProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold">地図でのピン調整（モバイル専用）</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Web では地図表示に対応していません。iOS / Android 実機またはシミュレーターでご確認ください。
      </ThemedText>
      <View style={styles.meta}>
        <ThemedText type="small" themeColor="textSecondary">
          設定状態: {coordinates ? 'ピン設定済み' : '未設定'} / 判定半径: {radius}m
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  meta: {
    marginTop: 4,
  },
});
