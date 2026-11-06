import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AvatarCustomizeTab } from '@/presentation/constants/avatar-customize-tabs';
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

/**
 * アバター作成・パーツカスタマイズ画面
 */
export default function CreateAvatarScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [previewMode, setPreviewMode] = useState<AvatarPreviewMode>('standing');
  const [activeTab, setActiveTab] = useState<AvatarCustomizeTab>('hair');
  const [savedJson, setSavedJson] = useState<string | null>(null);

  const handlePartChange = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    const jsonString = JSON.stringify(config, null, 2);
    if (Platform.OS === 'web') {
      setSavedJson(jsonString);
      return;
    }
    Alert.alert('アバター設定を保存しました', jsonString, [
      {
        text: '島へ移動する',
        onPress: () => {
          router.replace('/');
        },
      },
    ]);
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

        {/* 保存完了モーダル（Web確認用） */}
        {savedJson && (
          <Modal
            transparent
            animationType="fade"
            onRequestClose={() => setSavedJson(null)}
            accessibilityLabel="アバター設定を保存しました"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <ThemedText style={styles.modalTitle}>✅ アバター設定を保存しました</ThemedText>
                <ThemedText style={styles.modalSubtitle}>保存されるJSONデータ (Step 5):</ThemedText>
                <View style={styles.codeBlock}>
                  <ThemedText style={styles.codeText}>{savedJson}</ThemedText>
                </View>
                <View style={styles.modalActions}>
                  <Pressable style={styles.secondaryButton} onPress={() => setSavedJson(null)}>
                    <ThemedText style={styles.secondaryButtonText}>微調整を続ける</ThemedText>
                  </Pressable>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => {
                      setSavedJson(null);
                      router.replace('/');
                    }}
                  >
                    <ThemedText style={styles.primaryButtonText}>島へ移動する 🏝️</ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}
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
    paddingTop: Platform.OS === 'web' ? 56 : 0,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  codeBlock: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#38BDF8',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#00B4D8',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
