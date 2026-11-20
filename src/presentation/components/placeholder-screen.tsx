import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { Spacing } from '@/presentation/constants/theme';

export type PlaceholderLink = {
  label: string;
  href: Href;
};

export type PlaceholderAction = {
  label: string;
  onPress: () => void;
};

type PlaceholderScreenProps = {
  title: string;
  description: string;
  links?: PlaceholderLink[];
  actions?: PlaceholderAction[];
  children?: ReactNode;
  // シート（formSheet）の中では ScrollView の中身が表示されないため、true にして View で並べる
  inSheet?: boolean;
};

// 画面を実装するまでの仮の画面（#18）。各画面の Issue で中身を置き換える
export function PlaceholderScreen({
  title,
  description,
  links = [],
  actions = [],
  children,
  inSheet = false,
}: PlaceholderScreenProps) {
  const body = (
    <>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText themeColor="textSecondary">{description}</ThemedText>
      {links.map((link) => (
        <Link key={link.label} href={link.href} asChild>
          <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <ThemedView type="backgroundElement" style={styles.buttonInner}>
              <ThemedText>{link.label}</ThemedText>
            </ThemedView>
          </Pressable>
        </Link>
      ))}
      {actions.map((action) => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          onPress={action.onPress}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <ThemedView type="backgroundElement" style={styles.buttonInner}>
            <ThemedText>{action.label}</ThemedText>
          </ThemedView>
        </Pressable>
      ))}
      {children}
    </>
  );

  return (
    <ThemedView style={styles.container}>
      {inSheet ? (
        <View style={styles.content}>{body}</View>
      ) : (
        // ヘッダーやステータスバーの下に潜らないよう、余白は ScrollView に自動で調整させる
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
        >
          {body}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  button: {
    alignSelf: 'stretch',
  },
  buttonInner: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
