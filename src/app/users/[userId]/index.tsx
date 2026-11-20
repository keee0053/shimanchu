import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  return (
    <PlaceholderScreen
      title="プロフィール詳細"
      description={`自分・他人共通のプロフィール（#23）。userId: ${userId}`}
    />
  );
}
