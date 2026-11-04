import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  AVATAR_CUSTOMIZE_TABS,
  type AvatarCustomizeTab,
  EYE_TYPE_OPTIONS,
  GLASSES_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_STYLE_OPTIONS,
  OUTFIT_OPTIONS,
  SKIN_TONE_OPTIONS,
} from '@/domain/constants/avatar-parts';
import type { AvatarConfig } from '@/domain/entities/avatar';
import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { Spacing } from '@/presentation/constants/theme';

interface PartsSelectorProps {
  config: AvatarConfig;
  activeTab: AvatarCustomizeTab;
  onTabChange: (tab: AvatarCustomizeTab) => void;
  onChange: <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => void;
}

export function PartsSelector({ config, activeTab, onTabChange, onChange }: PartsSelectorProps) {
  return (
    <ThemedView style={styles.container}>
      {/* カテゴリ別タブバー */}
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

      {/* タブ別の選択コンテンツ */}
      <View style={styles.contentContainer}>
        {activeTab === 'hair' && (
          <View>
            <ThemedText style={styles.sectionTitle}>髪色を選ぶ</ThemedText>
            <View style={styles.paletteRow}>
              {HAIR_COLOR_OPTIONS.map((c) => {
                const isSelected = config.hairColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <Pressable
                    key={c.id}
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
                    style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                    onPress={() => onChange('hairStyle', h.id)}
                  >
                    <ThemedText style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                      {h.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === 'skin' && (
          <View>
            <ThemedText style={styles.sectionTitle}>肌色パレット</ThemedText>
            <View style={styles.skinList}>
              {SKIN_TONE_OPTIONS.map((s) => {
                const isSelected = config.skinTone.toLowerCase() === s.hex.toLowerCase();
                return (
                  <Pressable
                    key={s.id}
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

        {activeTab === 'face' && (
          <View>
            <ThemedText style={styles.sectionTitle}>目・表情を選ぶ</ThemedText>
            <View style={styles.grid}>
              {EYE_TYPE_OPTIONS.map((e) => {
                const isSelected = config.eyeType === e.id;
                return (
                  <Pressable
                    key={e.id}
                    style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                    onPress={() => onChange('eyeType', e.id)}
                  >
                    <ThemedText style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                      {e.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === 'outfit' && (
          <View>
            <ThemedText style={styles.sectionTitle}>服装を選ぶ</ThemedText>
            <View style={styles.grid}>
              {OUTFIT_OPTIONS.map((o) => {
                const isSelected = config.outfit === o.id;
                return (
                  <Pressable
                    key={o.id}
                    style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                    onPress={() => onChange('outfit', o.id)}
                  >
                    <ThemedText style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                      {o.name}
                    </ThemedText>
                    <ThemedText style={styles.cardDesc}>{o.description}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === 'accessory' && (
          <View>
            <ThemedText style={styles.sectionTitle}>メガネを選ぶ</ThemedText>
            <View style={styles.grid}>
              {GLASSES_OPTIONS.map((g) => {
                const isSelected = config.glasses === g.id;
                return (
                  <Pressable
                    key={g.id}
                    style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                    onPress={() => onChange('glasses', g.id)}
                  >
                    <ThemedText style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                      {g.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </ThemedView>
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
    flexBasis: '31%',
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
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
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#37474F',
  },
  cardTitleSelected: {
    color: '#0077B6',
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 10,
    color: '#78909C',
    textAlign: 'center',
    marginTop: 2,
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
