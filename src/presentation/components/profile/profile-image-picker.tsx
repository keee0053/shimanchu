import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { profileImagePickerRepository } from '@/container';
import type { PreparedProfileImage } from '@/domain/entities/profile-image';
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
  /**
   * 選択・解除を即座に `profiles.image_path` および Storage 上の旧ファイル整理へ反映するかどうか（必須）。
   * 初回プロフィール設定（`profiles` 行作成前）や「保存」ボタン押下時に確定する編集画面では `false` を指定し、保存・キャンセル時の最後の候補の整理を呼び出し側で行うこと（途中離脱時の孤立ファイル整理は #93）。
   */
  updateProfileRecord: boolean;
};

/**
 * プロフィール画像の選択・アップロード・削除を行う UI コンポーネント。
 * 初回設定（`profiles` 行作成前）や一括保存型の編集画面では `updateProfileRecord={false}` を指定すること。
 */
export function ProfileImagePicker({
  imagePath,
  onChangeImagePath,
  updateProfileRecord,
}: ProfileImagePickerProps) {
  const [localPreview, setLocalPreview] = useState<{
    imagePath: string;
    uri: string;
  } | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const uploadMutation = useUploadProfileImage();
  const removeMutation = useRemoveProfileImage();

  const isBusy = isPicking || uploadMutation.isPending || removeMutation.isPending;
  const unpersistedSessionImagePath =
    localPreview && localPreview.imagePath === imagePath ? localPreview.imagePath : null;
  const activeLocalPreviewUri = unpersistedSessionImagePath ? (localPreview?.uri ?? null) : null;

  const handlePickImage = async () => {
    setErrorMessage(null);
    setNoticeMessage(null);

    let prepared: PreparedProfileImage | null;
    setIsPicking(true);
    try {
      prepared = await profileImagePickerRepository.pickAndPrepareProfileImage();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'プロフィール画像の選択に失敗しました。',
      );
      return;
    } finally {
      setIsPicking(false);
    }

    if (!prepared) {
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({
        image: prepared,
        previousImagePath: imagePath,
        unpersistedPreviousImagePath: updateProfileRecord ? null : unpersistedSessionImagePath,
        updateProfileRecord,
      });
      setLocalPreview({ imagePath: result.imagePath, uri: result.localPreviewUri });
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
    if (!imagePath) {
      return;
    }
    setErrorMessage(null);
    setNoticeMessage(null);

    if (!updateProfileRecord) {
      if (unpersistedSessionImagePath) {
        try {
          await removeMutation.mutateAsync({
            unpersistedImagePath: unpersistedSessionImagePath,
            updateProfileRecord: false,
          });
        } catch {
          // 未保存候補の Storage 削除失敗でも画面上の選択解除は完了させる
        }
      }
      setLocalPreview(null);
      onChangeImagePath(null);
      return;
    }

    try {
      const result = await removeMutation.mutateAsync({
        currentImagePath: imagePath,
        updateProfileRecord: true,
      });
      setLocalPreview(null);
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

  const hasImage = Boolean(imagePath);

  return (
    <View style={styles.container}>
      <ProfileImage imagePath={imagePath} localUri={activeLocalPreviewUri} size={96} />

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
            {isPicking
              ? '画像を選択中...'
              : uploadMutation.isPending
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
  // TODO(#14): テーマカラーの整備にあわせてボタン・エラー色を共通テーマに統一する
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
