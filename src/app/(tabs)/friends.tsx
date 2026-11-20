import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';

const SAMPLE_USER_ID = 'sample-user';

export default function FriendsScreen() {
  return (
    <PlaceholderScreen
      title="友達"
      description="友達一覧・届いた申請"
      links={[
        { label: '友達を検索して申請（モーダル）', href: '/friend-search' },
        {
          label: 'プロフィール詳細',
          href: { pathname: '/users/[userId]', params: { userId: SAMPLE_USER_ID } },
        },
      ]}
    />
  );
}
