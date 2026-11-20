import { router } from 'expo-router';

import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';

export default function GroupSwitcherSheet() {
  return (
    <PlaceholderScreen
      inSheet
      title="グループの切り替え"
      description="参加中のグループ一覧（#25）"
      actions={[
        {
          label: 'グループ追加（モーダル）',
          // シートをモーダルに置き換える（閉じてから開くと、閉じる途中で開けないことがある）
          onPress: () => router.replace('/group-add'),
        },
      ]}
    />
  );
}
