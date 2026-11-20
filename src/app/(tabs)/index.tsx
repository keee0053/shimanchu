import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';

// 仮のグループ ID・ユーザー ID（画面を実装するときに実データに置き換える）
const SAMPLE_GROUP_ID = 'sample-group';
const SAMPLE_USER_ID = 'sample-user';

export default function HomeScreen() {
  return (
    <PlaceholderScreen
      title="ホーム"
      description="最後に開いたグループの島（#32）。グループが0件のときはグループ追加へ案内する（#25）"
      links={[
        { label: 'グループの切り替え（シート）', href: '/group-switcher' },
        {
          label: '簡易プロフィール（シート）',
          href: { pathname: '/users/[userId]/preview', params: { userId: SAMPLE_USER_ID } },
        },
        {
          label: 'グループ管理',
          href: { pathname: '/groups/[groupId]/manage', params: { groupId: SAMPLE_GROUP_ID } },
        },
        { label: '「島を見せるか」の確認（モーダル）', href: '/presence-prompt' },
      ]}
    />
  );
}
