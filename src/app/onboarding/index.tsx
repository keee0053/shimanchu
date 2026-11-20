import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';

export default function OnboardingProfileScreen() {
  return (
    <PlaceholderScreen
      title="初回設定: プロフィール"
      description="プロフィールの入力（#22）。入力中の内容は端末に残す"
      links={[{ label: '次へ（アバター）', href: '/onboarding/avatar' }]}
    />
  );
}
