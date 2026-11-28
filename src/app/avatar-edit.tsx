import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { AvatarConfig } from '@/domain/entities/avatar';
import { AvatarEditor } from '@/presentation/components/avatar';
import { StateMessage } from '@/presentation/components/state-message';
import { useMyAvatarConfig, useUpdateMyAvatarConfig } from '@/presentation/queries/avatar';

/**
 * アバターの編集（2回目以降）。保存済みの設定から始め、保存したら前の画面に戻る
 */
export default function AvatarEditScreen() {
  const router = useRouter();
  const { data: savedConfig, isPending, isError, isRefetchError, refetch } = useMyAvatarConfig();
  const updateAvatar = useUpdateMyAvatarConfig();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/me');
    }
  };

  if (isPending) {
    return <StateMessage />;
  }
  // 一度も読み込めていないときだけ全面のエラーにする。
  // 読み込み済みで再取得だけ失敗したときは、編集中の設定が消えないよう画面を残す
  if (isError && savedConfig === undefined) {
    return (
      <StateMessage
        message="アバターを読み込めませんでした。通信状況を確認してください。"
        action={{ label: '再読み込み', onPress: () => void refetch() }}
      />
    );
  }
  if (!savedConfig) {
    return (
      <StateMessage
        message="アカウントの登録がまだ終わっていません。"
        action={{ label: '戻る', onPress: goBack }}
      />
    );
  }

  const handleSubmit = async (config: AvatarConfig) => {
    setErrorMessage(null);
    try {
      await updateAvatar.mutateAsync(config);
    } catch (error) {
      setErrorMessage(
        `保存できませんでした。${
          error instanceof Error && error.message
            ? error.message
            : '通信状況を確認して、もう一度お試しください。'
        }`,
      );
      return;
    }
    goBack();
  };

  return (
    <AvatarEditor
      title="アバター編集"
      initialConfig={savedConfig}
      submitLabel="保存する"
      submittingLabel="保存中..."
      isSubmitting={updateAvatar.isPending}
      errorMessage={
        errorMessage ??
        (isRefetchError
          ? '最新のアバターを読み込めませんでした。通信状況を確認してください。'
          : null)
      }
      onSubmit={(config) => void handleSubmit(config)}
    />
  );
}
