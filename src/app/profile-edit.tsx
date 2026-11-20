import type { BirthDateVisibility, Gender } from '@/domain/entities/profile';
import { useProfile, useUpdateProfile } from '@/presentation/queries/profiles';
import { profileFormSchema, type ProfileFormData } from '@/presentation/schemas/profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BIRTH_DATE_VISIBILITY_OPTIONS: { value: BirthDateVisibility; label: string }[] = [
  { value: 'full', label: '生年月日と年齢' },
  { value: 'age', label: '年齢のみ' },
  { value: 'hidden', label: '非公開' },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: 'unspecified', label: '回答しない' },
];

export default function ProfileEditScreen() {
  const currentUserId = 'target-user-id'; // 認証実装（#21）後にログイン中のユーザー ID に差し替え
  const { data: profile, isLoading } = useProfile(currentUserId);
  const updateMutation = useUpdateProfile();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    values: {
      displayName: profile?.displayName ?? '',
      publicId: profile?.publicId ?? '',
      bio: profile?.bio ?? '',
      birthDate: profile?.birthDate ?? '',
      birthDateVisibility: profile?.birthDateVisibility ?? 'age',
      gender: profile?.gender ?? 'unspecified',
      discoverable: profile?.discoverable ?? true,
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(
      {
        userId: currentUserId,
        input: {
          displayName: data.displayName,
          publicId: data.publicId,
          bio: data.bio.trim() ? data.bio : null,
          birthDate: data.birthDate,
          birthDateVisibility: data.birthDateVisibility,
          gender: data.gender,
          discoverable: data.discoverable,
        },
      },
      {
        onSuccess: () => {
          Alert.alert('完了', 'プロフィールを更新しました', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: () => {
          Alert.alert('エラー', '保存に失敗しました。時間をおいて再試行してください。');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>プロフィール編集</Text>

      {/* 表示名 */}
      <View style={styles.field}>
        <Text style={styles.label}>表示名（必須）</Text>
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.displayName && styles.inputError]}
              placeholder="例: たろう"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.displayName && <Text style={styles.errorText}>{errors.displayName.message}</Text>}
      </View>

      {/* 公開 ID */}
      <View style={styles.field}>
        <Text style={styles.label}>公開 ID（必須・半角英小文字と数字 4〜20 文字）</Text>
        <Controller
          control={control}
          name="publicId"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.publicId && styles.inputError]}
              placeholder="例: taro1234"
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.publicId && <Text style={styles.errorText}>{errors.publicId.message}</Text>}
      </View>

      {/* 自己紹介 */}
      <View style={styles.field}>
        <Text style={styles.label}>自己紹介（100文字以内）</Text>
        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea, errors.bio && styles.inputError]}
              placeholder="自己紹介を入力してください"
              multiline
              numberOfLines={4}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.bio && <Text style={styles.errorText}>{errors.bio.message}</Text>}
      </View>

      {/* 生年月日 */}
      <View style={styles.field}>
        <Text style={styles.label}>生年月日 (必須・YYYY-MM-DD)</Text>
        <Controller
          control={control}
          name="birthDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.birthDate && styles.inputError]}
              placeholder="例: 2003-05-15"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate.message}</Text>}
      </View>

      {/* 生年月日の公開範囲 */}
      <View style={styles.field}>
        <Text style={styles.label}>生年月日の公開範囲</Text>
        <Controller
          control={control}
          name="birthDateVisibility"
          render={({ field: { onChange, value } }) => (
            <View style={styles.chipRow}>
              {BIRTH_DATE_VISIBILITY_OPTIONS.map((option) => {
                const selected = value === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => onChange(option.value)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </View>

      {/* 性別 */}
      <View style={styles.field}>
        <Text style={styles.label}>性別</Text>
        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, value } }) => (
            <View style={styles.chipRow}>
              {GENDER_OPTIONS.map((option) => {
                const selected = value === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => onChange(option.value)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </View>

      {/* グループ候補に表示する */}
      <View style={styles.switchField}>
        <Text style={styles.switchLabel}>友達の友達としてグループ候補に表示する</Text>
        <Controller
          control={control}
          name="discoverable"
          render={({ field: { onChange, value } }) => (
            <Switch value={value} onValueChange={onChange} />
          )}
        />
      </View>

      {/* 保存ボタン */}
      <TouchableOpacity
        style={[styles.saveButton, updateMutation.isPending && styles.buttonDisabled]}
        onPress={() => {
          void handleSubmit(onSubmit)();
        }}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.saveButtonText}>保存する</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#212529',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#495057',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#212529',
  },
  inputError: {
    borderColor: '#fa5252',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#fa5252',
    fontSize: 12,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#228be6',
    borderColor: '#228be6',
  },
  chipText: {
    fontSize: 14,
    color: '#495057',
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  switchField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  switchLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  saveButton: {
    backgroundColor: '#228be6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
