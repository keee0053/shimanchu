import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AvatarConfig, AvatarPreviewMode } from '@/domain/entities/avatar';
import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import type { AvatarCustomizeTab } from '@/presentation/constants/avatar-customize-tabs';
import { BottomTabInset, Spacing } from '@/presentation/constants/theme';

import { AvatarPreviewSection } from './avatar-preview-section';
import { PartsSelector } from './parts-selector';

type AvatarEditorProps = {
  title: string;
  initialConfig: AvatarConfig;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  /** 保存に失敗したときなどに、決定ボタンの上に出すメッセージ */
  errorMessage: string | null;
  onSubmit: (config: AvatarConfig) => void;
};

/**
 * アバターのプレビューとパーツの選択（初回の作成と編集で共通）
 */
export function AvatarEditor({
  title,
  initialConfig,
  submitLabel,
  submittingLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
}: AvatarEditorProps) {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig);
  const [previewMode, setPreviewMode] = useState<AvatarPreviewMode>('standing');
  const [activeTab, setActiveTab] = useState<AvatarCustomizeTab>('hair');

  const handlePartChange = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>{title}</ThemedText>
        </View>

        {/* スクロールコンテンツ */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* 上部: プレビューエリア（立ち姿・浮き輪姿） */}
          <AvatarPreviewSection config={config} mode={previewMode} onModeChange={setPreviewMode} />

          {/* 下部: パーツ・カラーセレクター */}
          <PartsSelector
            config={config}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChange={handlePartChange}
          />
        </ScrollView>

        {/* フッター固定: 決定ボタン */}
        <View style={styles.footer}>
          {errorMessage && (
            <ThemedText type="small" accessibilityRole="alert" style={styles.errorText}>
              {errorMessage}
            </ThemedText>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={submitLabel}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.submitButton,
              isSubmitting && styles.disabled,
              pressed && styles.pressed,
            ]}
            onPress={() => onSubmit(config)}
          >
            <ThemedText style={styles.submitButtonText}>
              {isSubmitting ? submittingLabel : submitLabel}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 56 : 0,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263238',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  footer: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  // TODO(#14): テーマカラーの整備にあわせてエラー色を共通テーマに統一する
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#00B4D8',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B4D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
