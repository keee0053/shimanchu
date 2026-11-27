import { useRouter } from 'expo-router';
import { useState } from 'react';

import { type AvatarConfig, DEFAULT_AVATAR_CONFIG } from '@/domain/entities/avatar';
import { AvatarEditor } from '@/presentation/components/avatar';
import { StateMessage } from '@/presentation/components/state-message';
import { useRegister } from '@/presentation/queries/registration';
import { useRegistrationDraftStore } from '@/presentation/stores/registration-draft-store';

/**
 * 初回のアバター作成。決定すると、入力したプロフィールとアバターでアカウントを登録する（#16）
 */
export default function OnboardingAvatarScreen() {
  const router = useRouter();
  const draft = useRegistrationDraftStore((s) => s.draft);
  const clearDraft = useRegistrationDraftStore((s) => s.clearDraft);
  const register = useRegister();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // プロフィールの入力内容はメモリにだけあるので、アプリを閉じると消える
  if (!draft) {
    return (
      <StateMessage
        message="プロフィールの入力内容がありません。もう一度入力してください。"
        action={{ label: 'プロフィールの入力へ', onPress: () => router.replace('/onboarding') }}
      />
    );
  }

  const handleSubmit = async (avatarConfig: AvatarConfig) => {
    setErrorMessage(null);
    try {
      const result = await register.mutateAsync({ draft, avatarConfig });
      if (!result.ok) {
        setErrorMessage(
          'この公開 ID はほかの人が使い始めました。前の画面に戻って公開 ID を変えてください。',
        );
        return;
      }
    } catch (error) {
      setErrorMessage(
        `登録できませんでした。${
          error instanceof Error && error.message
            ? error.message
            : '通信状況を確認して、もう一度お試しください。'
        }`,
      );
      return;
    }

    clearDraft();
    router.replace('/');
  };

  return (
    <AvatarEditor
      title="アバター作成"
      initialConfig={DEFAULT_AVATAR_CONFIG}
      submitLabel="このアバターで決定！"
      submittingLabel="登録中..."
      isSubmitting={register.isPending}
      errorMessage={errorMessage}
      onSubmit={(config) => void handleSubmit(config)}
    />
  );
}
