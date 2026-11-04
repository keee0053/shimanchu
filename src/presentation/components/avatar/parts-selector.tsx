import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  AVATAR_BASE_STYLE_OPTIONS,
  AVATAR_CUSTOMIZE_TABS,
  type AvatarCustomizeTab,
  EYE_TYPE_OPTIONS,
  GLASSES_OPTIONS,
  MOUTH_TYPE_OPTIONS,
} from '@/domain/constants/avatar-parts';
import type { AvatarBaseStyle, AvatarConfig } from '@/domain/entities/avatar';
import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { Spacing } from '@/presentation/constants/theme';

interface PartsSelectorProps {
  config: AvatarConfig;
  activeTab: AvatarCustomizeTab;
  onTabChange: (tab: AvatarCustomizeTab) => void;
  onChange: <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => void;
}

const THUMBNAIL_MAP: Record<AvatarBaseStyle, number> = {
  char1_cap_red: require('@/assets/avatar/char1_cap_red.png'),
  char2_border_navy: require('@/assets/avatar/char2_border_navy.png'),
  char3_cap_blue: require('@/assets/avatar/char3_cap_blue.png'),
  char4_cap_green: require('@/assets/avatar/char4_cap_green.png'),
  char5_long_hair: require('@/assets/avatar/char5_long_hair.png'),
  char6_jacket_green: require('@/assets/avatar/char6_jacket_green.png'),
  char7_jacket_teal: require('@/assets/avatar/char7_jacket_teal.png'),
  char8_jacket_black: require('@/assets/avatar/char8_jacket_black.png'),
  char9_tshirt_red: require('@/assets/avatar/char9_tshirt_red.png'),
  char10_jacket_olive: require('@/assets/avatar/char10_jacket_olive.png'),
  char11_graphic_dark: require('@/assets/avatar/char11_graphic_dark.png'),
  char12_wavy_hair: require('@/assets/avatar/char12_wavy_hair.png'),
};

export function PartsSelector({ config, activeTab, onTabChange, onChange }: PartsSelectorProps) {
  return (
    <ThemedView style={styles.container}>
      {/* タブバー */}
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

      {/* タブコンテンツ */}
      <View style={styles.contentContainer}>
        {/* スタイル一覧タブ（添付画像の全12体） */}
        {activeTab === 'style' && (
          <View>
            <ThemedText style={styles.sectionTitle}>
              ベーススタイルを選ぶ（添付画像デザイン）
            </ThemedText>
            <View style={styles.styleGrid}>
              {AVATAR_BASE_STYLE_OPTIONS.map((s) => {
                const isSelected = config.baseStyle === s.id;
                return (
                  <Pressable
                    key={s.id}
                    style={[styles.styleCard, isSelected && styles.styleCardSelected]}
                    onPress={() => onChange('baseStyle', s.id)}
                  >
                    <Image
                      source={THUMBNAIL_MAP[s.id]}
                      style={styles.thumbnailImage}
                      resizeMode="contain"
                    />
                    <ThemedText
                      style={[styles.styleName, isSelected && styles.styleNameSelected]}
                      numberOfLines={1}
                    >
                      {s.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* 表情タブ（目・口） */}
        {activeTab === 'face' && (
          <View>
            <ThemedText style={styles.sectionTitle}>目つき・表情を選ぶ</ThemedText>
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

            <ThemedText style={[styles.sectionTitle, { marginTop: 16 }]}>口・口元を選ぶ</ThemedText>
            <View style={styles.grid}>
              {MOUTH_TYPE_OPTIONS.map((m) => {
                const isSelected = config.mouthType === m.id;
                return (
                  <Pressable
                    key={m.id}
                    style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                    onPress={() => onChange('mouthType', m.id)}
                  >
                    <ThemedText style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                      {m.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* メガネ・小物タブ */}
        {activeTab === 'accessory' && (
          <View>
            <ThemedText style={styles.sectionTitle}>メガネ・小物を合わせる</ThemedText>
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
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  styleCard: {
    flexBasis: '31%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleCardSelected: {
    borderColor: '#00B4D8',
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
  },
  thumbnailImage: {
    width: 44,
    height: 80,
    marginBottom: 6,
  },
  styleName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#37474F',
  },
  styleNameSelected: {
    color: '#0077B6',
    fontWeight: '700',
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
});
