import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { useForegroundLocationSync } from '@/presentation/hooks/use-foreground-location-sync';
import { queryClient } from '@/presentation/query-client';

function ForegroundLocationTracker() {
  useForegroundLocationSync();
  return null;
}

// 画面のつなぎ方は docs/ARCHITECTURE.md の「画面遷移」
//   Stack で進む画面: ここに並べ、タブより上に重ねる（開いている間はタブバーを出さない）
//   モーダル: presentation: 'modal'
//   シート: presentation: 'formSheet'
// ログイン・初回設定・タブの振り分け（Stack.Protected）は #21 で追加する
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ForegroundLocationTracker />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />

          <Stack.Screen name="users/[userId]/index" options={{ title: 'プロフィール' }} />
          <Stack.Screen name="profile-edit" options={{ title: 'プロフィール編集' }} />
          <Stack.Screen name="avatar-edit" options={{ title: 'アバター編集' }} />
          <Stack.Screen name="settings/index" options={{ title: '設定' }} />
          <Stack.Screen name="settings/presence" options={{ title: '島の公開設定' }} />
          <Stack.Screen name="settings/places" options={{ title: '家・学校の場所登録' }} />
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
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
