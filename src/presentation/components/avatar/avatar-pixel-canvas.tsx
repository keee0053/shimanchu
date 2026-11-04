import React from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import type { AvatarBaseStyle, AvatarConfig, AvatarPreviewMode } from '@/domain/entities/avatar';

interface AvatarPixelCanvasProps {
  config: AvatarConfig;
  mode?: AvatarPreviewMode;
  size?: number;
}

// 添付画像からピクセル完全抽出した全12体のアセットマップ
const AVATAR_IMAGE_MAP: Record<AvatarBaseStyle, ImageSourcePropType> = {
  char1_cap_red: require('@/assets/avatar/char1_cap_red.png'),
  char2_border_navy: require('@/assets/avatar/char2_border_navy.png'),
  char3_cap_blue: require('@/assets/avatar/char3_cap_blue.png'),
  char4_cap_green: require('@/assets/avatar/char4_cap_green.png'),
  char5_long_hair: require('@/assets/avatar/char5_long_hair.png'),
  char6_jacket_green: require('@/assets/avatar/char6_jacket_green.png'),
  char7_jacket_teal: require('@/assets/avatar/char7_jacket_teal.png'),
  char8_jacket_black: require('@/assets/avatar/char8_jacket_black.png'),
  char9_tshirt_red: require('@/assets/avatar/char9_tshirt_red.png'),
  char10_jacket_olive: require('@/assets/avatar/char10_jacket_olive.png'),
  char11_graphic_dark: require('@/assets/avatar/char11_graphic_dark.png'),
  char12_wavy_hair: require('@/assets/avatar/char12_wavy_hair.png'),
};

/**
 * 添付画像（Simple Human Avatars）の本物のドット絵を描画するレンダラー
 */
export function AvatarPixelCanvas({
  config,
  mode = 'standing',
  size = 180,
}: AvatarPixelCanvasProps) {
  const { baseStyle, eyeType, mouthType, glasses } = config;
  const isDrifting = mode === 'drifting';

  const avatarSource = AVATAR_IMAGE_MAP[baseStyle] ?? AVATAR_IMAGE_MAP.char2_border_navy;

  const width = size;
  const height = (size * 125) / 58;

  return (
    <View style={[styles.container, { width, height }]}>
      {/* 添付画像のオリジナルアバター（ピクセルパーフェクト） */}
      <Image
        source={avatarSource}
        style={[styles.avatarImage, { width, height }]}
        resizeMode="contain"
      />

      {/* 目・口・表情の上書きオーバーレイ（デフォルトのdots/neutral以外が選ばれた場合） */}
      {(eyeType !== 'dots' || mouthType !== 'neutral') && (
        <View style={styles.overlayLayer}>
          <Svg width={width} height={height} viewBox="0 0 58 125">
            {/* 目のカスタマイズ */}
            {eyeType === 'smile' && (
              <>
                {/* 既存の目を肌色でカバー */}
                <Rect x="20" y="47" width="4" height="6" fill="#F8BC9C" />
                <Rect x="34" y="47" width="4" height="6" fill="#F8BC9C" />
                {/* にっこり目 ^^ */}
                <Rect x="20" y="48" width="4" height="2" fill="#1C1917" />
                <Rect x="19" y="50" width="2" height="2" fill="#1C1917" />
                <Rect x="23" y="50" width="2" height="2" fill="#1C1917" />
                <Rect x="34" y="48" width="4" height="2" fill="#1C1917" />
                <Rect x="33" y="50" width="2" height="2" fill="#1C1917" />
                <Rect x="37" y="50" width="2" height="2" fill="#1C1917" />
              </>
            )}

            {eyeType === 'calm' && (
              <>
                <Rect x="20" y="47" width="4" height="6" fill="#F8BC9C" />
                <Rect x="34" y="47" width="4" height="6" fill="#F8BC9C" />
                {/* ジト目 */}
                <Rect x="19" y="49" width="6" height="2" fill="#1C1917" />
                <Rect x="21" y="51" width="3" height="2" fill="#1C1917" />
                <Rect x="33" y="49" width="6" height="2" fill="#1C1917" />
                <Rect x="34" y="51" width="3" height="2" fill="#1C1917" />
              </>
            )}

            {eyeType === 'sparkle' && (
              <>
                <Rect x="20" y="47" width="4" height="6" fill="#F8BC9C" />
                <Rect x="34" y="47" width="4" height="6" fill="#F8BC9C" />
                {/* パッチリ丸目 ＋ 白目ハイライト */}
                <Rect x="20" y="47" width="4" height="6" fill="#1C1917" />
                <Rect x="21" y="48" width="2" height="2" fill="#FFFFFF" />
                <Rect x="34" y="47" width="4" height="6" fill="#1C1917" />
                <Rect x="35" y="48" width="2" height="2" fill="#FFFFFF" />
              </>
            )}

            {/* 口のカスタマイズ */}
            {mouthType === 'smile' && (
              <>
                <Rect x="27" y="58" width="4" height="3" fill="#F8BC9C" />
                <Rect x="27" y="59" width="4" height="2" fill="#B86B52" />
                <Rect x="25" y="57" width="2" height="2" fill="#B86B52" />
                <Rect x="31" y="57" width="2" height="2" fill="#B86B52" />
              </>
            )}

            {mouthType === 'open' && (
              <>
                <Rect x="27" y="57" width="4" height="5" fill="#F8BC9C" />
                <Rect x="27" y="58" width="4" height="4" fill="#6A1B14" />
                <Rect x="27" y="60" width="4" height="2" fill="#E57373" />
              </>
            )}

            {mouthType === 'small' && (
              <>
                <Rect x="27" y="57" width="4" height="4" fill="#F8BC9C" />
                <Rect x="28" y="58" width="2" height="2" fill="#B86B52" />
              </>
            )}
          </Svg>
        </View>
      )}

      {/* メガネ・小物のオーバーレイ */}
      {glasses !== 'none' && (
        <View style={styles.overlayLayer}>
          <Svg width={width} height={height} viewBox="0 0 58 125">
            {glasses === 'glasses_round' && (
              <>
                {/* 左丸フレーム */}
                <Rect
                  x="17"
                  y="45"
                  width="10"
                  height="10"
                  fill="none"
                  stroke="#5D4037"
                  strokeWidth="2"
                />
                {/* 右丸フレーム */}
                <Rect
                  x="31"
                  y="45"
                  width="10"
                  height="10"
                  fill="none"
                  stroke="#5D4037"
                  strokeWidth="2"
                />
                {/* ブリッジ */}
                <Rect x="27" y="49" width="4" height="2" fill="#5D4037" />
              </>
            )}
            {glasses === 'glasses_square' && (
              <>
                {/* 黒縁メガネ */}
                <Rect x="16" y="46" width="11" height="8" fill="#1C1917" />
                <Rect x="18" y="48" width="7" height="4" fill="#F8BC9C" />
                <Rect x="31" y="46" width="11" height="8" fill="#1C1917" />
                <Rect x="33" y="48" width="7" height="4" fill="#F8BC9C" />
                <Rect x="27" y="48" width="4" height="2" fill="#1C1917" />
              </>
            )}
          </Svg>
        </View>
      )}

      {/* 漂流姿（浮き輪 ＋ 波しぶき）のドット絵オーバーレイ */}
      {isDrifting && (
        <View style={styles.overlayLayer}>
          <Svg width={width} height={height} viewBox="0 0 58 125">
            {/* 下半身を水面でカバー */}
            <Rect x="8" y="88" width="42" height="37" fill="#38BDF8" opacity={0.92} />

            {/* 赤白ストライプの浮き輪（ピクセルアート） */}
            <Rect x="6" y="80" width="46" height="18" fill="#1C1917" />
            <Rect x="8" y="82" width="42" height="14" fill="#EF4444" />
            {/* 白ストライプ */}
            <Rect x="16" y="82" width="6" height="14" fill="#FFFFFF" />
            <Rect x="36" y="82" width="6" height="14" fill="#FFFFFF" />
            <Rect x="8" y="84" width="4" height="10" fill="#FFFFFF" />
            <Rect x="46" y="84" width="4" height="10" fill="#FFFFFF" />
            {/* 浮き輪の影 */}
            <Rect x="8" y="93" width="42" height="3" fill="#B91C1C" />

            {/* 波のしぶきとハイライト */}
            <Rect x="2" y="98" width="54" height="4" fill="#0284C7" />
            <Rect x="0" y="102" width="58" height="23" fill="#0369A1" />
            <Rect x="4" y="97" width="8" height="2" fill="#E0F2FE" />
            <Rect x="44" y="97" width="10" height="2" fill="#E0F2FE" />
          </Svg>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlayLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
