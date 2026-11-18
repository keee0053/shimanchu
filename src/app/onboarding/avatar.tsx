import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';
import { useTemporaryFlowStore } from '@/presentation/stores/temporary-flow-store';

export default function OnboardingAvatarScreen() {
  const setStep = useTemporaryFlowStore((s) => s.setStep);

  return (
    <PlaceholderScreen
      title="初回設定: アバター"
      description="アバターの作成（#41）。最後にプロフィールの行をまとめて作る（#22）"
      actions={[{ label: 'はじめる（仮）', onPress: () => setStep('ready') }]}
    />
  );
}
