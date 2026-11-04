import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import type { AvatarCustomizeTab } from '@/domain/constants/avatar-parts';
import {
  type AvatarConfig,
  type AvatarPreviewMode,
  DEFAULT_AVATAR_CONFIG,
} from '@/domain/entities/avatar';
import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { AvatarPreviewSection } from '@/presentation/components/avatar/avatar-preview-section';
import { PartsSelector } from '@/presentation/components/avatar/parts-selector';
import { Spacing } from '@/presentation/constants/theme';

export default function CreateAvatarScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [previewMode, setPreviewMode] = useState<AvatarPreviewMode>('standing');
  const [activeTab, setActiveTab] = useState<AvatarCustomizeTab>('style');

  const handlePartChange = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    Alert.alert(
      'アバターが完成しました！',
      `スタイル: ${config.baseStyle}\n目: ${config.eyeType}\n口: ${config.mouthType}\nメガネ: ${config.glasses}`,
      [
        {
          text: '島へ移動する',
          onPress: () => {
            router.replace('/');
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
          >
            <ThemedText style={styles.backButtonText}>← 戻る</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>アバター作成</ThemedText>
          <View style={styles.headerPlaceholder} />
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
          <Pressable style={styles.submitButton} onPress={handleSave}>
            <ThemedText style={styles.submitButtonText}>このアバターで決定！</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#0077B6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263238',
  },
  headerPlaceholder: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
});
