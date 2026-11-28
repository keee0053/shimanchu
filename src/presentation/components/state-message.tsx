import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { Spacing } from '@/presentation/constants/theme';

type StateMessageProps = {
  /** 省略すると読み込み中の表示にする */
  message?: string;
  action?: { label: string; onPress: () => void };
};

/** 読み込み中・エラー・データがないときに、画面の中央に出すメッセージ */
export function StateMessage({ message, action }: StateMessageProps) {
  return (
    <ThemedView style={styles.container}>
      {message ? (
        <ThemedText style={styles.message}>{message}</ThemedText>
      ) : (
        <ActivityIndicator size="large" />
      )}
      {action && (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <ThemedText style={styles.buttonText}>{action.label}</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

// TODO(#14): テーマカラーの整備にあわせて共通テーマに統一する
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  message: {
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0284C7',
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.four,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.75,
  },
});
