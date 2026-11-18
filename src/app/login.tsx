import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';
import { useTemporaryFlowStore } from '@/presentation/stores/temporary-flow-store';

export default function LoginScreen() {
  const setStep = useTemporaryFlowStore((s) => s.setStep);

  return (
    <PlaceholderScreen
      title="ログイン"
      description="Google ログイン（#20）"
      actions={[
        { label: 'ログインする（仮）', onPress: () => setStep('onboarding') },
        { label: 'ログイン済み・プロフィールありにする（仮）', onPress: () => setStep('ready') },
      ]}
    />
  );
}
