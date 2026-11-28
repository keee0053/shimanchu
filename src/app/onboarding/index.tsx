import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { REGISTRATION_RULES } from '@/domain/entities/registration';
import { BirthDateField } from '@/presentation/components/form/birth-date-field';
import { Checkbox } from '@/presentation/components/form/checkbox';
import { FormErrorText, FormField } from '@/presentation/components/form/form-field';
import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { Spacing } from '@/presentation/constants/theme';
import { useTheme } from '@/presentation/hooks/use-theme';
import { useCheckPublicIdTaken } from '@/presentation/queries/registration';
import { registrationSchema, type RegistrationInput } from '@/presentation/schemas/registration';
import { useRegistrationDraftStore } from '@/presentation/stores/registration-draft-store';

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const draft = useRegistrationDraftStore((s) => s.draft);
  const setDraft = useRegistrationDraftStore((s) => s.setDraft);
  const checkPublicIdTaken = useCheckPublicIdTaken();
  // TODO(#36): 利用規約・プライバシーポリシーのページができたらリンク先を開く
  const [pendingLegalDocument, setPendingLegalDocument] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      displayName: draft?.displayName ?? '',
      publicId: draft?.publicId ?? '',
      birthDate: draft?.birthDate ?? '',
      // 入力内容が残っているのは同意して進んだときだけなので、戻ってきたときは同意済みにする
      agreedToTerms: draft !== null,
    },
  });

  const onSubmit = async (input: RegistrationInput) => {
    let taken: boolean;
    try {
      taken = await checkPublicIdTaken.mutateAsync(input.publicId);
    } catch (error) {
      // Web では Alert が表示されないため、フォームの中にエラーを出す
      setError('root.publicIdCheck', {
        message: `公開 ID を確かめられませんでした。${
          error instanceof Error && error.message
            ? error.message
            : '通信状況を確認して、もう一度お試しください。'
        }`,
      });
      return;
    }
    if (taken) {
      setError(
        'publicId',
        { message: 'この公開 ID はすでに使われています' },
        { shouldFocus: true },
      );
      return;
    }

    // profiles の行はアバター作成の最後にまとめて作る（#16）。ここでは DB に保存しない
    setDraft({
      displayName: input.displayName,
      publicId: input.publicId,
      birthDate: input.birthDate,
    });
    router.push('/onboarding/avatar');
  };

  const inputStyle = [styles.input, { color: theme.text }];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
      >
        <ThemedText themeColor="textSecondary" type="small">
          表示名と公開 ID
          は、友達と同じグループのメンバーに公開されます。生年月日は公開されず、年齢だけが見えます（あとでプロフィール編集から変えられます）。
        </ThemedText>

        <FormField label="表示名" required error={errors.displayName?.message}>
          <Controller
            control={control}
            name="displayName"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <TextInput
                ref={ref}
                accessibilityLabel="表示名"
                placeholder="例: たろう"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                maxLength={REGISTRATION_RULES.DISPLAY_NAME_MAX_LENGTH}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={[inputStyle, errors.displayName && styles.inputError]}
              />
            )}
          />
        </FormField>

        <FormField
          label="公開 ID"
          required
          hint={`友達があなたを検索するときに入力する ID です。\n半角の英小文字か数字で${REGISTRATION_RULES.PUBLIC_ID_MIN_LENGTH}〜${REGISTRATION_RULES.PUBLIC_ID_MAX_LENGTH}文字`}
          error={errors.publicId?.message}
        >
          <Controller
            control={control}
            name="publicId"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <TextInput
                ref={ref}
                accessibilityLabel="公開 ID"
                placeholder="例: taro1234"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="ascii-capable"
                maxLength={REGISTRATION_RULES.PUBLIC_ID_MAX_LENGTH}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={[inputStyle, errors.publicId && styles.inputError]}
              />
            )}
          />
        </FormField>

        <FormField label="生年月日" required error={errors.birthDate?.message}>
          <Controller
            control={control}
            name="birthDate"
            render={({ field: { value, onChange, onBlur } }) => (
              <BirthDateField
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                hasError={Boolean(errors.birthDate)}
              />
            )}
          />
        </FormField>

        <View style={styles.agreement}>
          <Controller
            control={control}
            name="agreedToTerms"
            render={({ field: { value, onChange } }) => (
              <Checkbox
                checked={value}
                onChange={onChange}
                accessibilityLabel={`${REGISTRATION_RULES.MIN_AGE_YEARS}歳以上で、利用規約とプライバシーポリシーに同意する`}
              >
                <ThemedText type="small">
                  {REGISTRATION_RULES.MIN_AGE_YEARS}歳以上で、
                  <ThemedText
                    type="small"
                    accessibilityRole="link"
                    style={styles.link}
                    onPress={() => setPendingLegalDocument('利用規約')}
                  >
                    利用規約
                  </ThemedText>
                  と
                  <ThemedText
                    type="small"
                    accessibilityRole="link"
                    style={styles.link}
                    onPress={() => setPendingLegalDocument('プライバシーポリシー')}
                  >
                    プライバシーポリシー
                  </ThemedText>
                  に同意する
                </ThemedText>
              </Checkbox>
            )}
          />
          {pendingLegalDocument && (
            <ThemedText type="small" themeColor="textSecondary">
              {pendingLegalDocument}は準備中です。
            </ThemedText>
          )}
          {errors.agreedToTerms?.message && (
            <FormErrorText message={errors.agreedToTerms.message} />
          )}
        </View>

        {errors.root?.publicIdCheck?.message && (
          <FormErrorText message={errors.root.publicIdCheck.message} />
        )}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => void handleSubmit(onSubmit)()}
          style={({ pressed }) => [
            styles.submitButton,
            isSubmitting && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText style={styles.submitButtonText}>
            {isSubmitting ? '確認中...' : '次へ：アバター作成'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

// TODO(#14): テーマカラーの整備にあわせてボタン・エラー色を共通テーマに統一する
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  agreement: {
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 10,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  link: {
    color: '#0284C7',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#0284C7',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 700,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
