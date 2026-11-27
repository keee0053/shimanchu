import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/presentation/components/themed-text';
import { Spacing } from '@/presentation/constants/theme';

type FormFieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
};

/** 入力欄の枠。ラベル・補足・エラーを入力欄の上下に並べる */
export function FormField({ label, required = false, hint, error, children }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">
        {label}
        {required && <ThemedText style={styles.requiredMark}> 必須</ThemedText>}
      </ThemedText>
      {hint && (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      )}
      {children}
      {error && <FormErrorText message={error} />}
    </View>
  );
}

/** フォームのエラーメッセージ */
export function FormErrorText({ message }: { message: string }) {
  return (
    <ThemedText type="small" style={styles.errorText}>
      {message}
    </ThemedText>
  );
}

// TODO(#14): テーマカラーの整備にあわせて共通テーマに統一する
const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  requiredMark: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: 700,
  },
  errorText: {
    color: '#DC2626',
  },
});
