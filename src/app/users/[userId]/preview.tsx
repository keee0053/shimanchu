import { router, useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';

export default function UserPreviewSheet() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  return (
    <PlaceholderScreen
      inSheet
      title="簡易プロフィール"
      description="島でアバターを押したときに出すシート"
      actions={[
        {
          label: 'プロフィール詳細を見る',
          // シートを詳細の画面に置き換える（閉じてから進むと、閉じる途中で進めないことがある）
          onPress: () => router.replace({ pathname: '/users/[userId]', params: { userId } }),
        },
      ]}
    />
  );
}
