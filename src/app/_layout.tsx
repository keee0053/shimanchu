import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { queryClient } from '@/presentation/query-client';
import { useTemporaryFlowStore } from '@/presentation/stores/temporary-flow-store';

// 画面のつなぎ方は docs/ARCHITECTURE.md の「画面遷移」
//   Stack で進む画面: ここに並べ、タブより上に重ねる（開いている間はタブバーを出さない）
//   モーダル: presentation: 'modal'
//   シート: presentation: 'formSheet'
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const step = useTemporaryFlowStore((s) => s.step);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Protected guard={step === 'login'}>
            <Stack.Screen name="login" options={{ headerShown: false }} />
          </Stack.Protected>

          <Stack.Protected guard={step === 'onboarding'}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack.Protected>

          <Stack.Protected guard={step === 'ready'}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            <Stack.Screen name="users/[userId]/index" options={{ title: 'プロフィール' }} />
            <Stack.Screen name="profile-edit" options={{ title: 'プロフィール編集' }} />
            <Stack.Screen name="avatar-edit" options={{ title: 'アバター編集' }} />
            <Stack.Screen name="settings/index" options={{ title: '設定' }} />
            <Stack.Screen name="settings/presence" options={{ title: '島の公開設定' }} />
            <Stack.Screen name="groups/[groupId]/manage" options={{ title: 'グループ管理' }} />

            <Stack.Screen
              name="users/[userId]/preview"
              options={{
                presentation: 'formSheet',
                headerShown: false,
                sheetAllowedDetents: [0.4, 0.8],
                sheetGrabberVisible: true,
              }}
            />
            <Stack.Screen
              name="group-switcher"
              options={{
                presentation: 'formSheet',
                headerShown: false,
                sheetAllowedDetents: [0.5, 1],
                sheetGrabberVisible: true,
              }}
            />

            <Stack.Screen
              name="group-add"
              options={{ presentation: 'modal', title: 'グループ追加' }}
            />
            <Stack.Screen
              name="friend-search"
              options={{ presentation: 'modal', title: '友達を探す' }}
            />
            <Stack.Screen
              name="presence-prompt"
              options={{ presentation: 'modal', title: '島を見せるか' }}
            />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
