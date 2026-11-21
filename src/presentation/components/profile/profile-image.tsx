import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { useProfileImageUrl } from '@/presentation/queries/profile-images';

type ProfileImageProps = {
  imagePath?: string | null;
  localUri?: string | null;
  size?: number;
  fallbackLabel?: string;
};

/**
 * 非公開バケットの署名付き URL またはローカルプレビュー URI でプロフィール画像を表示するコンポーネント
 */
export function ProfileImage({
  imagePath,
  localUri,
  size = 88,
  fallbackLabel = '未設定',
}: ProfileImageProps) {
  const signedUrlQuery = useProfileImageUrl(localUri ? null : imagePath);
  const displayUri = localUri ?? signedUrlQuery.data ?? null;

  const dimensionStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (displayUri) {
    return (
      <Image
        source={
          !localUri && imagePath ? { uri: displayUri, cacheKey: imagePath } : { uri: displayUri }
        }
        style={[styles.image, dimensionStyle]}
        contentFit="cover"
        transition={150}
        accessibilityLabel="プロフィール画像"
      />
    );
  }

  return (
    <ThemedView type="backgroundElement" style={[styles.placeholder, dimensionStyle]}>
      <View style={styles.placeholderInner}>
        <ThemedText type="small" themeColor="textSecondary">
          {signedUrlQuery.isLoading ? '読込中' : fallbackLabel}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.25)',
  },
  placeholderInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
