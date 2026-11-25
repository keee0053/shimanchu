import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';

export default function SettingsScreen() {
  return (
    <PlaceholderScreen
      title="設定"
      description="ログアウト・アカウント削除（#34 #35）"
      links={[
        { label: '島の公開設定', href: '/settings/presence' },
        { label: '家・学校の場所登録', href: '/settings/places' },
      ]}
    />
  );
}
