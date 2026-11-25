import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';

import type { PlaceMapPickerProps } from './place-map-picker-types';

/**
 * iOS 以外（Android / Web）向けのプレースホルダー表示
 */
export function PlaceMapPicker({ coordinates, radius }: PlaceMapPickerProps) {
  const isAndroid = Platform.OS === 'android';

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold">
        {isAndroid ? '地図表示は現在準備中です' : '地図でのピン調整（iOS 専用）'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {isAndroid
          ? 'Android 版では地図表示を準備中のため、上の「現在地を登録する」ボタンから今いる場所を登録してください。'
          : 'Web では地図表示に対応していません。iOS 実機またはシミュレーターでご確認ください。'}
      </ThemedText>
      <View style={styles.meta}>
        <ThemedText type="small" themeColor="textSecondary">
          設定状態: {coordinates ? (isAndroid ? '登録済み' : '位置設定済み') : '未設定'} / 判定半径:{' '}
          {radius}m
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
