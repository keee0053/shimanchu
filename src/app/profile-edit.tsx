import { useProfile, useUpdateProfile } from '@/presentation/queries/profiles';
import { profileFormSchema, type ProfileFormData } from '@/presentation/schemas/profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileEditScreen() {
  const currentUserId = 'target-user-id'; // 実際はログイン中のユーザーID
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
      university: profile?.university ?? '',
      faculty: profile?.faculty ?? '',
      year: profile?.year ? String(profile.year) : '',
      bio: profile?.bio ?? '',
      birthday: profile?.birthday ?? '',
      gender: profile?.gender ?? '',
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(
      {
        userId: currentUserId,
        input: {
          displayName: data.displayName,
          university: data.university || undefined,
          faculty: data.faculty || undefined,
          year: data.year ? Number(data.year) : undefined,
          bio: data.bio || undefined,
          birthday: data.birthday || undefined,
          gender: data.gender || undefined,
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

      {/* 大学名 */}
      <View style={styles.field}>
        <Text style={styles.label}>大学名</Text>
        <Controller
          control={control}
          name="university"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="例: ○○大学"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.university && <Text style={styles.errorText}>{errors.university.message}</Text>}
      </View>

      {/* 学部・学科 */}
      <View style={styles.field}>
        <Text style={styles.label}>学部・学科</Text>
        <Controller
          control={control}
          name="faculty"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="例: 工学部 情報工学科"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.faculty && <Text style={styles.errorText}>{errors.faculty.message}</Text>}
      </View>

      {/* 学年 */}
      <View style={styles.field}>
        <Text style={styles.label}>学年</Text>
        <Controller
          control={control}
          name="year"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="例: 3"
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.year && <Text style={styles.errorText}>{errors.year.message}</Text>}
      </View>

      {/* 自己紹介 */}
      <View style={styles.field}>
        <Text style={styles.label}>自己紹介</Text>
        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
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

      {/* 誕生日 */}
      <View style={styles.field}>
        <Text style={styles.label}>誕生日 (YYYY-MM-DD)</Text>
        <Controller
          control={control}
          name="birthday"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="例: 2003-05-15"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.birthday && <Text style={styles.errorText}>{errors.birthday.message}</Text>}
      </View>

      {/* 性別 */}
      <View style={styles.field}>
        <Text style={styles.label}>性別</Text>
        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="例: 回答しない、その他"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
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
