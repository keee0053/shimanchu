import { Stack } from 'expo-router';

// 初回設定: プロフィール → アバター
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: 'プロフィール' }} />
      <Stack.Screen name="avatar" options={{ title: 'アバター' }} />
    </Stack>
  );
}
