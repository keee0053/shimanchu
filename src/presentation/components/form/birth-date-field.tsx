import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  type DateParts,
  formatIsoDate,
  getBirthDateRange,
  getJstToday,
  parseIsoDate,
} from '@/domain/services/registration-birth-date';
import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { Spacing } from '@/presentation/constants/theme';
import { useTheme } from '@/presentation/hooks/use-theme';

type BirthDateFieldProps = {
  /** YYYY-MM-DD。未選択は空文字 */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
};

// ピッカーとは端末のタイムゾーンの Date でやりとりし、年月日だけを取り出す
function toLocalDate({ year, month, day }: DateParts): Date {
  return new Date(year, month - 1, day);
}

function fromLocalDate(date: Date): string {
  return formatIsoDate({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

function formatLabel(value: string): string | null {
  const parsed = parseIsoDate(value);
  return parsed ? `${parsed.year}年${parsed.month}月${parsed.day}日` : null;
}

/**
 * 生年月日の入力（日付ピッカー。範囲は120年前〜18年前の今日）
 * iOS は下から出るシートでホイール、Android はダイアログ、Web は YYYY-MM-DD の文字入力
 */
export function BirthDateField({ value, onChange, onBlur, hasError = false }: BirthDateFieldProps) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const range = useMemo(() => getBirthDateRange(getJstToday(new Date())), []);
  const minimumDate = toLocalDate(range.min);
  const maximumDate = toLocalDate(range.max);
  const parsed = parseIsoDate(value);
  const pickerValue = parsed ? toLocalDate(parsed) : maximumDate;
  const [iosDraft, setIosDraft] = useState(pickerValue);

  if (Platform.OS === 'web') {
    return (
      <TextInput
        accessibilityLabel="生年月日"
        placeholder="例: 2003-05-15"
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        style={[styles.field, { color: theme.text }, hasError && styles.fieldError]}
      />
    );
  }

  const close = () => {
    setIsOpen(false);
    onBlur?.();
  };

  const label = formatLabel(value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ? `生年月日 ${label}` : '生年月日を選ぶ'}
        onPress={() => {
          setIosDraft(pickerValue);
          setIsOpen(true);
        }}
        style={({ pressed }) => [
          styles.field,
          hasError && styles.fieldError,
          pressed && styles.pressed,
        ]}
      >
        <ThemedText themeColor={label ? 'text' : 'textSecondary'}>
          {label ?? '選んでください'}
        </ThemedText>
      </Pressable>

      {isOpen && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          positiveButton={{ label: '決定' }}
          negativeButton={{ label: 'キャンセル' }}
          onValueChange={(_event, date) => {
            onChange(fromLocalDate(date));
            close();
          }}
          onDismiss={close}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={isOpen} transparent animationType="slide" onRequestClose={close}>
          <Pressable accessibilityLabel="閉じる" style={styles.backdrop} onPress={close} />
          <ThemedView style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Pressable accessibilityRole="button" onPress={close} hitSlop={Spacing.two}>
                <ThemedText themeColor="textSecondary">キャンセル</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                hitSlop={Spacing.two}
                onPress={() => {
                  onChange(fromLocalDate(iosDraft));
                  close();
                }}
              >
                <ThemedText type="smallBold" style={styles.doneText}>
                  決定
                </ThemedText>
              </Pressable>
            </View>
            <DateTimePicker
              value={iosDraft}
              mode="date"
              display="spinner"
              locale="ja_JP"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onValueChange={(_event, date) => setIosDraft(date)}
            />
          </ThemedView>
        </Modal>
      )}
    </>
  );
}

// TODO(#14): テーマカラーの整備にあわせて共通テーマに統一する
const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 10,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  fieldError: {
    borderColor: '#DC2626',
  },
  pressed: {
    opacity: 0.75,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheet: {
    paddingBottom: Spacing.five,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  doneText: {
    color: '#0284C7',
    fontSize: 16,
  },
});
