import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  EYE_TYPE_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_STYLE_OPTIONS,
  OUTFIT_OPTIONS,
  SKIN_TONE_OPTIONS,
} from '@/domain/constants/avatar-parts';
import type { AvatarConfig } from '@/domain/entities/avatar';
import { ThemedText } from '@/presentation/components/themed-text';
import {
  AVATAR_CUSTOMIZE_TABS,
  type AvatarCustomizeTab,
} from '@/presentation/constants/avatar-customize-tabs';
import { Spacing } from '@/presentation/constants/theme';

import { AvatarPixelCanvas } from './avatar-pixel-canvas';

interface PartsSelectorProps {
  config: AvatarConfig;
  activeTab: AvatarCustomizeTab;
  onTabChange: (tab: AvatarCustomizeTab) => void;
  onChange: <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => void;
}

/**
 * アバターの各カテゴリ（髪型・髪色・目・肌色・服）を選択するUIコンポーネント
 */
export function PartsSelector({ config, activeTab, onTabChange, onChange }: PartsSelectorProps) {
  return (
    <View style={styles.container}>
      {/* 仕様通りのカテゴリ別タブバー */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContainer}
      >
        {AVATAR_CUSTOMIZE_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => onTabChange(tab.id)}
            >
              <ThemedText style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 各カテゴリの選択肢 */}
      <View style={styles.contentContainer}>
        {/* 1. 髪型・髪色 */}
        {activeTab === 'hair' && (
          <View>
            <ThemedText style={styles.sectionTitle}>髪色を選ぶ</ThemedText>
            <View style={styles.paletteRow}>
              {HAIR_COLOR_OPTIONS.map((c) => {
                const isSelected = config.hairColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    accessibilityLabel={`髪色: ${c.name}`}
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c.hex },
                      isSelected && styles.colorCircleSelected,
                    ]}
                    onPress={() => onChange('hairColor', c.hex)}
                  >
                    {isSelected && <View style={styles.innerDot} />}
                  </Pressable>
                );
              })}
            </View>

            <ThemedText style={[styles.sectionTitle, { marginTop: 16 }]}>髪型を選ぶ</ThemedText>
            <View style={styles.grid}>
              {HAIR_STYLE_OPTIONS.map((h) => {
                const isSelected = config.hairStyle === h.id;
                return (
                  <Pressable
                    key={h.id}
                    accessibilityRole="button"
                    accessibilityLabel={`髪型: ${h.name}`}
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                    onPress={() => onChange('hairStyle', h.id)}
                  >
                    <AvatarPixelCanvas config={{ ...config, hairStyle: h.id }} size={40} />
                    <ThemedText
                      style={[
                        styles.cardTitle,
                        { marginTop: 6 },
                        isSelected && styles.cardTitleSelected,
                      ]}
                    >
                      {h.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* 2. 目・表情 */}
        {activeTab === 'face' && (
          <View>
            <ThemedText style={styles.sectionTitle}>目・表情を選ぶ</ThemedText>
            <View style={styles.grid}>
              {EYE_TYPE_OPTIONS.map((e) => {
                const isSelected = config.eyeType === e.id;
                return (
                  <Pressable
                    key={e.id}
                    accessibilityRole="button"
                    accessibilityLabel={`目・表情: ${e.name}`}
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                    onPress={() => onChange('eyeType', e.id)}
                  >
                    <AvatarPixelCanvas config={{ ...config, eyeType: e.id }} size={40} />
                    <ThemedText
                      style={[
                        styles.cardTitle,
                        { marginTop: 6 },
                        isSelected && styles.cardTitleSelected,
                      ]}
                    >
                      {e.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* 3. 肌色 */}
        {activeTab === 'skin' && (
          <View>
            <ThemedText style={styles.sectionTitle}>肌色パレット（4〜5段階）</ThemedText>
            <View style={styles.skinList}>
              {SKIN_TONE_OPTIONS.map((s) => {
                const isSelected = config.skinTone.toLowerCase() === s.hex.toLowerCase();
                return (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    accessibilityLabel={`肌色: ${s.name}`}
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.skinCard, isSelected && styles.skinCardSelected]}
                    onPress={() => onChange('skinTone', s.hex)}
                  >
                    <View style={[styles.skinColorPreview, { backgroundColor: s.hex }]} />
                    <ThemedText style={styles.skinName}>{s.name}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* 4. 服（胴体） */}
        {activeTab === 'outfit' && (
          <View>
            <ThemedText style={styles.sectionTitle}>服（胴体）を選ぶ</ThemedText>
            <View style={styles.grid}>
              {OUTFIT_OPTIONS.map((o) => {
                const isSelected = config.outfit === o.id;
                return (
                  <Pressable
                    key={o.id}
                    accessibilityRole="button"
                    accessibilityLabel={`服: ${o.name}`}
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                    onPress={() => onChange('outfit', o.id)}
                  >
                    <AvatarPixelCanvas config={{ ...config, outfit: o.id }} size={40} />
                    <ThemedText
                      style={[
                        styles.cardTitle,
                        { marginTop: 6 },
                        isSelected && styles.cardTitleSelected,
                      ]}
                    >
                      {o.name}
                    </ThemedText>
                    <ThemedText style={styles.cardDesc}>{o.description}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabScrollContainer: {
    paddingHorizontal: Spacing.three,
    gap: 8,
    paddingBottom: 8,
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  tabItemActive: {
    backgroundColor: '#263238',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#607D8B',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: Spacing.three,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#546E7A',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  colorCircleSelected: {
    borderColor: '#00B4D8',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    flexBasis: '47%',
    flexGrow: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardSelected: {
    borderColor: '#00B4D8',
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    color: '#37474F',
  },
  cardTitleSelected: {
    color: '#0077B6',
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 11,
    color: '#78909C',
    textAlign: 'center',
    marginTop: 4,
  },
  skinList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skinCard: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 10,
  },
  skinCardSelected: {
    borderColor: '#00B4D8',
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
  },
  skinColorPreview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  skinName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#37474F',
  },
});
