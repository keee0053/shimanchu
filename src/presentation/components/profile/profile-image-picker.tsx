import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/presentation/components/themed-text';
import { Spacing } from '@/presentation/constants/theme';
import {
  useRemoveProfileImage,
  useUploadProfileImage,
} from '@/presentation/queries/profile-images';

import { ProfileImage } from './profile-image';

type ProfileImagePickerProps = {
  imagePath: string | null;
  onChangeImagePath: (imagePath: string | null) => void;
  updateProfileRecord?: boolean;
};

/**
 * プロフィール画像の選択・アップロード・削除を行う UI コンポーネント
 */
export function ProfileImagePicker({
  imagePath,
  onChangeImagePath,
  updateProfileRecord = true,
}: ProfileImagePickerProps) {
  const [localPreviewUri, setLocalPreviewUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const uploadMutation = useUploadProfileImage();
  const removeMutation = useRemoveProfileImage();

  const isBusy = uploadMutation.isPending || removeMutation.isPending;

  const handlePickImage = async () => {
    setErrorMessage(null);
    setNoticeMessage(null);
    try {
      const result = await uploadMutation.mutateAsync({
        previousImagePath: imagePath,
        updateProfileRecord,
      });
      if (!result) {
        return;
      }
      setLocalPreviewUri(result.localPreviewUri);
      onChangeImagePath(result.imagePath);
      if (result.cleanupFailed) {
        setNoticeMessage('画像を更新しました（古い画像の削除は一部スキップされました）。');
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'プロフィール画像のアップロードに失敗しました。',
      );
    }
  };

  const handleRemoveImage = async () => {
    if (!imagePath && !localPreviewUri) {
      return;
    }
    setErrorMessage(null);
    setNoticeMessage(null);
    try {
      const result = await removeMutation.mutateAsync({
        currentImagePath: imagePath,
        updateProfileRecord,
      });
      setLocalPreviewUri(null);
      onChangeImagePath(null);
      if (result.cleanupFailed) {
        setNoticeMessage('画像の設定を解除しました（Storage 上のファイル削除に失敗しました）。');
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'プロフィール画像の削除に失敗しました。',
      );
    }
  };

  const hasImage = Boolean(imagePath || localPreviewUri);

  return (
    <View style={styles.container}>
      <ProfileImage imagePath={imagePath} localUri={localPreviewUri} size={96} />

      <View style={styles.buttons}>
        <Pressable
          accessibilityRole="button"
          disabled={isBusy}
          onPress={() => void handlePickImage()}
          style={({ pressed }) => [
            styles.primaryButton,
            isBusy && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText type="smallBold" style={styles.primaryButtonText}>
            {uploadMutation.isPending
              ? 'アップロード中...'
              : hasImage
                ? '画像を変更'
                : '画像を選ぶ'}
          </ThemedText>
        </Pressable>

        {hasImage && (
          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => void handleRemoveImage()}
            style={({ pressed }) => [
              styles.secondaryButton,
              isBusy && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <ThemedText type="smallBold" style={styles.secondaryButtonText}>
              {removeMutation.isPending ? '削除中...' : '画像を削除'}
            </ThemedText>
          </Pressable>
        )}
      </View>

      {noticeMessage && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.feedbackText}>
          {noticeMessage}
        </ThemedText>
      )}
      {errorMessage && (
        <ThemedText type="small" style={styles.errorText}>
          {errorMessage}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  secondaryButtonText: {
    color: '#DC2626',
  },
  feedbackText: {
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
