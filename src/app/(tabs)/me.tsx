import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';

export default function MyPageScreen() {
  return (
    <PlaceholderScreen
      title="マイページ"
      description="自分のプロフィール（#23）"
      links={[
        { label: 'プロフィール編集', href: '/profile-edit' },
        { label: 'アバター編集', href: '/avatar-edit' },
        { label: '設定', href: '/settings' },
      ]}
    />
  );
}
