import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/presentation/components/themed-text';
import { Spacing } from '@/presentation/constants/theme';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  accessibilityLabel: string;
  children: ReactNode;
};

/** チェックボックス。children にラベル（リンクを含めてよい）を渡す */
export function Checkbox({ checked, onChange, accessibilityLabel, children }: CheckboxProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={accessibilityLabel}
        hitSlop={Spacing.two}
        onPress={() => onChange(!checked)}
        style={[styles.box, checked && styles.boxChecked]}
      >
        {checked && <ThemedText style={styles.mark}>✓</ThemedText>}
      </Pressable>
      <View style={styles.label}>{children}</View>
    </View>
  );
}

// TODO(#14): テーマカラーの整備にあわせて共通テーマに統一する
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  box: {
    width: 24,
    height: 24,
    marginTop: 2,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  mark: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 700,
  },
  label: {
    flex: 1,
  },
});
