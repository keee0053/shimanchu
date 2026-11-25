import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { Spacing } from '@/presentation/constants/theme';

type NoticeBoxProps = {
  message: string;
};

/**
 * 場所登録画面の案内・注意メッセージを表示するボックス
 */
export function NoticeBox({ message }: NoticeBoxProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.noticeBox}>
      <ThemedText type="small">{message}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  noticeBox: {
    padding: Spacing.three,
    borderRadius: 12,
  },
});
