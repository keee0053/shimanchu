import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';

export default function GroupManageScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  return (
    <PlaceholderScreen
      title="グループ管理"
      description={`名前・招待・メンバー削除・譲渡・退出（#28）。groupId: ${groupId}`}
    />
  );
}
