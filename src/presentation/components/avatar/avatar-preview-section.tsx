import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AvatarConfig, AvatarPreviewMode } from '@/domain/entities/avatar';
import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { Spacing } from '@/presentation/constants/theme';

import { AvatarPixelCanvas } from './avatar-pixel-canvas';

interface AvatarPreviewSectionProps {
  config: AvatarConfig;
  mode: AvatarPreviewMode;
  onModeChange: (mode: AvatarPreviewMode) => void;
}

export function AvatarPreviewSection({ config, mode, onModeChange }: AvatarPreviewSectionProps) {
  const isDrifting = mode === 'drifting';

  return (
    <ThemedView style={styles.container}>
      {/* プレビュー背景カード */}
      <View style={[styles.card, isDrifting ? styles.oceanBackground : styles.islandBackground]}>
        {/* 背景の装飾ラベル */}
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>
            {isDrifting ? '🌊 海を漂流中（位置未取得）' : '🏝️ しまの生活（立ち姿）'}
          </ThemedText>
        </View>

        {/* ドット絵アバター描画 */}
        <View style={styles.canvasWrapper}>
          <AvatarPixelCanvas config={config} mode={mode} size={110} />
        </View>

        {/* 状態切り替えトグル */}
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleButton, !isDrifting && styles.toggleButtonActive]}
            onPress={() => onModeChange('standing')}
          >
            <ThemedText
              style={[styles.toggleButtonText, !isDrifting && styles.toggleButtonTextActive]}
            >
              🧍 通常の姿
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.toggleButton, isDrifting && styles.toggleButtonActive]}
            onPress={() => onModeChange('drifting')}
          >
            <ThemedText
              style={[styles.toggleButtonText, isDrifting && styles.toggleButtonTextActive]}
            >
              🛟 漂流姿（浮き輪）
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  card: {
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  islandBackground: {
    backgroundColor: '#E8F5E9', // 島のやさしいグリーン
  },
  oceanBackground: {
    backgroundColor: '#E0F7FA', // 海の爽やかなアクアブルー
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#37474F',
  },
  canvasWrapper: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 3,
    marginTop: 8,
    gap: 4,
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#78909C',
  },
  toggleButtonTextActive: {
    fontWeight: '700',
    color: '#263238',
  },
});
