import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';
import { useTemporaryFlowStore } from '@/presentation/stores/temporary-flow-store';

export default function SettingsScreen() {
  const setStep = useTemporaryFlowStore((s) => s.setStep);

  return (
    <PlaceholderScreen
      title="設定"
      description="ログアウト・アカウント削除（#34 #35）"
      links={[{ label: '島の公開設定', href: '/settings/presence' }]}
      actions={[{ label: 'ログイン画面に戻る（仮）', onPress: () => setStep('login') }]}
    />
  );
}
