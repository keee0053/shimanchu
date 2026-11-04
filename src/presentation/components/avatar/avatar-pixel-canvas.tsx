import React from 'react';
import Svg, { Rect } from 'react-native-svg';

import type { AvatarConfig, AvatarPreviewMode } from '@/domain/entities/avatar';

interface PixelData {
  x: number;
  y: number;
  w?: number;
  h?: number;
  color: string;
}

interface AvatarPixelCanvasProps {
  config: AvatarConfig;
  mode?: AvatarPreviewMode;
  size?: number;
}

/**
 * HEXカラーから明るさを少し落としたシャドウ色を計算する
 */
function getShadowColor(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = Math.max(0, parseInt(cleanHex.substring(0, 2), 16) - 35);
  const g = Math.max(0, parseInt(cleanHex.substring(2, 4), 16) - 35);
  const b = Math.max(0, parseInt(cleanHex.substring(4, 6), 16) - 35);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * HEXカラーからハイライト色を計算する
 */
function getHighlightColor(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = Math.min(255, parseInt(cleanHex.substring(0, 2), 16) + 30);
  const g = Math.min(255, parseInt(cleanHex.substring(2, 4), 16) + 30);
  const b = Math.min(255, parseInt(cleanHex.substring(4, 6), 16) + 30);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 24x30ピクセル規格のドット絵アバター描画コンポーネント
 */
export function AvatarPixelCanvas({
  config,
  mode = 'standing',
  size = 180,
}: AvatarPixelCanvasProps) {
  const { skinTone, hairStyle, hairColor, eyeType, outfit, glasses } = config;

  const skinBase = skinTone;
  const skinShadow = getShadowColor(skinTone);
  const skinHighlight = getHighlightColor(skinTone);

  const hairBase = hairColor;
  const hairShadow = getShadowColor(hairColor);
  const hairHighlight = getHighlightColor(hairColor);

  const pixels: PixelData[] = [];

  // ==========================================
  // 1. 体・首（Base Body）
  // ==========================================
  // 首 (x: 11-12, y: 15)
  pixels.push({ x: 11, y: 15, w: 2, h: 1, color: skinShadow });

  // 頭部・顔の輪郭 (x: 7-16, y: 6-14)
  // 顔のアウトライン・ベース肌
  pixels.push(
    // 額〜顔ベース
    { x: 8, y: 6, w: 8, h: 1, color: skinHighlight },
    { x: 7, y: 7, w: 10, h: 6, color: skinBase },
    { x: 7, y: 13, w: 10, h: 1, color: skinBase },
    { x: 8, y: 14, w: 8, h: 1, color: skinShadow },
    // 耳 (x: 6, y: 10-11 / x: 17, y: 10-11)
    { x: 6, y: 10, w: 1, h: 2, color: skinBase },
    { x: 17, y: 10, w: 1, h: 2, color: skinBase },
    { x: 6, y: 11, w: 1, h: 1, color: skinShadow },
    { x: 17, y: 11, w: 1, h: 1, color: skinShadow },
    // ほほのチーク
    { x: 8, y: 12, w: 2, h: 1, color: '#F7A7A6' },
    { x: 14, y: 12, w: 2, h: 1, color: '#F7A7A6' },
    // 鼻
    { x: 11, y: 11, w: 1, h: 1, color: skinShadow },
  );

  // ==========================================
  // 2. 目・表情（Eyes）
  // ==========================================
  const eyeColor = '#1A1A1A';
  if (eyeType === 'dots') {
    // 点目 (2x2ピクセル)
    pixels.push(
      { x: 9, y: 10, w: 2, h: 2, color: eyeColor },
      { x: 13, y: 10, w: 2, h: 2, color: eyeColor },
    );
  } else if (eyeType === 'smile') {
    // にっこり笑顔 (^^)
    pixels.push(
      { x: 9, y: 10, w: 2, h: 1, color: eyeColor },
      { x: 8, y: 11, w: 1, h: 1, color: eyeColor },
      { x: 10, y: 11, w: 1, h: 1, color: eyeColor },
      { x: 13, y: 10, w: 2, h: 1, color: eyeColor },
      { x: 12, y: 11, w: 1, h: 1, color: eyeColor },
      { x: 14, y: 11, w: 1, h: 1, color: eyeColor },
    );
  } else if (eyeType === 'calm') {
    // ジト目・細目
    pixels.push(
      { x: 8, y: 10, w: 3, h: 1, color: eyeColor },
      { x: 9, y: 11, w: 2, h: 1, color: eyeColor },
      { x: 13, y: 10, w: 3, h: 1, color: eyeColor },
      { x: 13, y: 11, w: 2, h: 1, color: eyeColor },
    );
  } else if (eyeType === 'sparkle') {
    // パッチリきらきら目
    pixels.push(
      { x: 8, y: 9, w: 3, h: 3, color: eyeColor },
      { x: 9, y: 9, w: 1, h: 1, color: '#FFFFFF' },
      { x: 13, y: 9, w: 3, h: 3, color: eyeColor },
      { x: 14, y: 9, w: 1, h: 1, color: '#FFFFFF' },
    );
  }

  // ==========================================
  // 3. 服装・胴体（Outfit）
  // ==========================================
  if (mode === 'standing') {
    // 通常立ち姿
    // 脚・ズボン (x: 9-14, y: 22-26)
    const pantsColor = '#2C3E50'; // ダークデニム
    const pantsShadow = '#1A252F';
    pixels.push(
      { x: 9, y: 22, w: 6, h: 1, color: pantsColor },
      { x: 9, y: 23, w: 2, h: 4, color: pantsColor },
      { x: 13, y: 23, w: 2, h: 4, color: pantsColor },
      { x: 10, y: 23, w: 1, h: 4, color: pantsShadow },
      { x: 14, y: 23, w: 1, h: 4, color: pantsShadow },
    );

    // 靴 (x: 8-10, y: 27 / x: 13-15, y: 27)
    const shoeColor = '#FFFFFF';
    const shoeSole = '#B0BEC5';
    pixels.push(
      { x: 8, y: 27, w: 3, h: 1, color: shoeColor },
      { x: 8, y: 28, w: 3, h: 1, color: shoeSole },
      { x: 13, y: 27, w: 3, h: 1, color: shoeColor },
      { x: 13, y: 28, w: 3, h: 1, color: shoeSole },
    );

    // 手・腕 (x: 6-7, 16-17, y: 17-21)
    pixels.push(
      { x: 6, y: 19, w: 1, h: 2, color: skinBase },
      { x: 17, y: 19, w: 1, h: 2, color: skinBase },
    );

    // 各トップス
    if (outfit === 'border_navy') {
      // 爽やかボーダーTシャツ
      pixels.push(
        { x: 8, y: 16, w: 8, h: 6, color: '#FFFFFF' },
        { x: 7, y: 17, w: 1, h: 2, color: '#FFFFFF' },
        { x: 16, y: 17, w: 1, h: 2, color: '#FFFFFF' },
        // ボーダーライン（ネイビー）
        { x: 8, y: 17, w: 8, h: 1, color: '#1B3A4B' },
        { x: 8, y: 19, w: 8, h: 1, color: '#1B3A4B' },
        { x: 8, y: 21, w: 8, h: 1, color: '#1B3A4B' },
      );
    } else if (outfit === 'hoodie_blue') {
      // ブルーパーカー
      pixels.push(
        { x: 7, y: 16, w: 10, h: 6, color: '#3A86FF' },
        { x: 6, y: 17, w: 1, h: 3, color: '#2667CC' },
        { x: 17, y: 17, w: 1, h: 3, color: '#2667CC' },
        // フードの紐・ポケット
        { x: 10, y: 17, w: 1, h: 2, color: '#FFFFFF' },
        { x: 13, y: 17, w: 1, h: 2, color: '#FFFFFF' },
        { x: 9, y: 20, w: 6, h: 2, color: '#2667CC' },
      );
    } else if (outfit === 'jacket_green') {
      // グリーンジャケット＋インナー
      pixels.push(
        { x: 10, y: 16, w: 4, h: 6, color: '#333333' }, // 黒インナー
        { x: 7, y: 16, w: 3, h: 6, color: '#4CAF50' }, // 左ジャケット
        { x: 14, y: 16, w: 3, h: 6, color: '#388E3C' }, // 右ジャケット
        { x: 6, y: 17, w: 1, h: 3, color: '#2E7D32' },
        { x: 17, y: 17, w: 1, h: 3, color: '#2E7D32' },
      );
    } else if (outfit === 'jacket_black') {
      // 黒レザージャケット＋白インナー
      pixels.push(
        { x: 10, y: 16, w: 4, h: 6, color: '#FFFFFF' }, // 白インナー
        { x: 7, y: 16, w: 3, h: 6, color: '#212121' },
        { x: 14, y: 16, w: 3, h: 6, color: '#141414' },
        { x: 6, y: 17, w: 1, h: 3, color: '#141414' },
        { x: 17, y: 17, w: 1, h: 3, color: '#141414' },
      );
    } else if (outfit === 'tshirt_white') {
      // シンプル白Tシャツ
      pixels.push(
        { x: 8, y: 16, w: 8, h: 6, color: '#FFFFFF' },
        { x: 7, y: 16, w: 1, h: 3, color: '#ECEFF1' },
        { x: 16, y: 16, w: 1, h: 3, color: '#ECEFF1' },
      );
    } else if (outfit === 'tshirt_red') {
      // 赤Tシャツ
      pixels.push(
        { x: 8, y: 16, w: 8, h: 6, color: '#E63946' },
        { x: 7, y: 16, w: 1, h: 3, color: '#C5222F' },
        { x: 16, y: 16, w: 1, h: 3, color: '#C5222F' },
      );
    } else {
      // グラフィックT（ダーク）
      pixels.push(
        { x: 8, y: 16, w: 8, h: 6, color: '#2B2D42' },
        { x: 7, y: 16, w: 1, h: 3, color: '#1D1E2C' },
        { x: 16, y: 16, w: 1, h: 3, color: '#1D1E2C' },
        { x: 11, y: 18, w: 2, h: 2, color: '#48CAE4' }, // ロゴ
      );
    }
  } else {
    // ==========================================
    // 漂流姿（Drifting: 浮き輪に乗っている）
    // ==========================================
    // 上半身（少し水に浸かっている）
    pixels.push({ x: 8, y: 16, w: 8, h: 4, color: '#3A86FF' });

    // バンザイまたは浮き輪をつかむ手
    pixels.push(
      { x: 5, y: 16, w: 2, h: 2, color: skinBase },
      { x: 17, y: 16, w: 2, h: 2, color: skinBase },
    );

    // 浮き輪（赤白ストライプ）
    const tubeRed = '#FF3366';
    const tubeWhite = '#FFFFFF';
    pixels.push(
      // 浮き輪の上部
      { x: 5, y: 19, w: 14, h: 3, color: tubeRed },
      { x: 8, y: 19, w: 2, h: 3, color: tubeWhite },
      { x: 14, y: 19, w: 2, h: 3, color: tubeWhite },
      // 浮き輪の下部・厚み
      { x: 4, y: 21, w: 16, h: 3, color: tubeRed },
      { x: 7, y: 21, w: 3, h: 3, color: tubeWhite },
      { x: 14, y: 21, w: 3, h: 3, color: tubeWhite },
    );

    // 周りの波・水しぶき
    const waterColor = '#00B4D8';
    const foamColor = '#CAF0F8';
    pixels.push(
      { x: 2, y: 23, w: 20, h: 1, color: waterColor },
      { x: 1, y: 24, w: 22, h: 2, color: waterColor },
      { x: 3, y: 23, w: 3, h: 1, color: foamColor },
      { x: 18, y: 23, w: 3, h: 1, color: foamColor },
      { x: 2, y: 26, w: 20, h: 2, color: '#0077B6' },
    );
  }

  // ==========================================
  // 4. メガネ・小物（Glasses）
  // ==========================================
  if (glasses === 'glasses_round') {
    const frameColor = '#8D6E63';
    pixels.push(
      { x: 7, y: 9, w: 4, h: 1, color: frameColor },
      { x: 7, y: 12, w: 4, h: 1, color: frameColor },
      { x: 7, y: 10, w: 1, h: 2, color: frameColor },
      { x: 10, y: 10, w: 1, h: 2, color: frameColor },
      { x: 11, y: 10, w: 2, h: 1, color: frameColor }, // ブリッジ
      { x: 13, y: 9, w: 4, h: 1, color: frameColor },
      { x: 13, y: 12, w: 4, h: 1, color: frameColor },
      { x: 13, y: 10, w: 1, h: 2, color: frameColor },
      { x: 16, y: 10, w: 1, h: 2, color: frameColor },
    );
  } else if (glasses === 'glasses_square') {
    const frameColor = '#1A1A1A';
    pixels.push(
      { x: 7, y: 9, w: 4, h: 3, color: frameColor },
      { x: 8, y: 10, w: 2, h: 1, color: '#FFFFFF' }, // レンズ光
      { x: 11, y: 10, w: 2, h: 1, color: frameColor },
      { x: 13, y: 9, w: 4, h: 3, color: frameColor },
      { x: 14, y: 10, w: 2, h: 1, color: '#FFFFFF' },
    );
  }

  // ==========================================
  // 5. 髪型・帽子（Hair / Hat）
  // ==========================================
  if (hairStyle === 'cap_forward') {
    // キャップ前かぶり（赤白）
    pixels.push(
      // クラウン（帽子本体）
      { x: 7, y: 3, w: 10, h: 4, color: '#D90429' },
      { x: 6, y: 5, w: 12, h: 3, color: '#D90429' },
      { x: 10, y: 4, w: 4, h: 3, color: '#FFFFFF' }, // 白フロントパネル
      // ツバ
      { x: 5, y: 7, w: 14, h: 1, color: '#EF233C' },
      // もみあげ・サイドの毛
      { x: 6, y: 8, w: 1, h: 3, color: hairBase },
      { x: 17, y: 8, w: 1, h: 3, color: hairBase },
    );
  } else if (hairStyle === 'cap_backward') {
    // キャップ後ろかぶり（ストリート風グリーン）
    pixels.push(
      { x: 7, y: 4, w: 10, h: 4, color: '#2B9348' },
      { x: 6, y: 6, w: 12, h: 2, color: '#2B9348' },
      // 後ろのアジャスター
      { x: 10, y: 7, w: 4, h: 1, color: '#55A630' },
      // 前髪チラ見せ
      { x: 8, y: 7, w: 2, h: 1, color: hairBase },
      { x: 14, y: 7, w: 2, h: 1, color: hairBase },
      { x: 6, y: 8, w: 1, h: 3, color: hairBase },
      { x: 17, y: 8, w: 1, h: 3, color: hairBase },
    );
  } else if (hairStyle === 'short_messy') {
    // 無造作ショート（毛先が遊んでる）
    pixels.push(
      { x: 7, y: 4, w: 10, h: 4, color: hairBase },
      { x: 6, y: 5, w: 2, h: 2, color: hairHighlight },
      { x: 15, y: 3, w: 3, h: 2, color: hairHighlight }, // ハネ毛
      { x: 6, y: 7, w: 12, h: 2, color: hairBase },
      // 前髪
      { x: 7, y: 7, w: 3, h: 2, color: hairShadow },
      { x: 11, y: 7, w: 2, h: 2, color: hairShadow },
      { x: 14, y: 7, w: 3, h: 2, color: hairShadow },
      // もみあげ
      { x: 6, y: 9, w: 1, h: 3, color: hairShadow },
      { x: 17, y: 9, w: 1, h: 3, color: hairShadow },
    );
  } else if (hairStyle === 'mush') {
    // マッシュルーム（丸みのある前髪）
    pixels.push(
      { x: 7, y: 3, w: 10, h: 5, color: hairBase },
      { x: 6, y: 6, w: 12, h: 3, color: hairBase },
      // ハイライト（頭頂部）
      { x: 8, y: 4, w: 7, h: 1, color: hairHighlight },
      // 前髪ライン（きれいに揃った丸み）
      { x: 7, y: 8, w: 10, h: 1, color: hairShadow },
      { x: 6, y: 9, w: 2, h: 2, color: hairShadow },
      { x: 16, y: 9, w: 2, h: 2, color: hairShadow },
    );
  } else if (hairStyle === 'center_part') {
    // センターパート（真ん中分け・サラサラ）
    pixels.push(
      { x: 7, y: 4, w: 10, h: 4, color: hairBase },
      { x: 6, y: 5, w: 4, h: 4, color: hairHighlight },
      { x: 14, y: 5, w: 4, h: 4, color: hairHighlight },
      // センターの分け目
      { x: 11, y: 6, w: 2, h: 2, color: skinBase },
      // 左右に流れる前髪
      { x: 7, y: 7, w: 3, h: 3, color: hairShadow },
      { x: 14, y: 7, w: 3, h: 3, color: hairShadow },
      { x: 6, y: 9, w: 1, h: 3, color: hairShadow },
      { x: 17, y: 9, w: 1, h: 3, color: hairShadow },
    );
  } else if (hairStyle === 'long_straight') {
    // ロングストレート（肩まで届く髪）
    pixels.push(
      { x: 7, y: 3, w: 10, h: 5, color: hairBase },
      { x: 6, y: 5, w: 12, h: 3, color: hairBase },
      { x: 8, y: 4, w: 7, h: 1, color: hairHighlight },
      // 前髪
      { x: 8, y: 7, w: 8, h: 2, color: hairShadow },
      // 両サイドのロングヘア（肩下まで）
      { x: 5, y: 8, w: 2, h: 12, color: hairBase },
      { x: 6, y: 10, w: 1, h: 10, color: hairShadow },
      { x: 17, y: 8, w: 2, h: 12, color: hairBase },
      { x: 17, y: 10, w: 1, h: 10, color: hairShadow },
    );
  } else if (hairStyle === 'wavy') {
    // ウェーブ・パーマ
    pixels.push(
      { x: 6, y: 3, w: 12, h: 5, color: hairBase },
      { x: 5, y: 5, w: 3, h: 3, color: hairHighlight },
      { x: 16, y: 5, w: 3, h: 3, color: hairHighlight },
      { x: 7, y: 7, w: 10, h: 2, color: hairShadow },
      // もこもこサイド
      { x: 5, y: 8, w: 2, h: 7, color: hairBase },
      { x: 17, y: 8, w: 2, h: 7, color: hairBase },
    );
  } else if (hairStyle === 'spiky') {
    // ツンツンスパイキー
    pixels.push(
      { x: 8, y: 3, w: 2, h: 2, color: hairHighlight },
      { x: 11, y: 2, w: 2, h: 3, color: hairHighlight },
      { x: 14, y: 3, w: 2, h: 2, color: hairHighlight },
      { x: 7, y: 5, w: 10, h: 4, color: hairBase },
      { x: 6, y: 7, w: 12, h: 2, color: hairShadow },
      { x: 6, y: 9, w: 1, h: 2, color: hairShadow },
      { x: 17, y: 9, w: 1, h: 2, color: hairShadow },
    );
  } else {
    // ボブ
    pixels.push(
      { x: 7, y: 3, w: 10, h: 5, color: hairBase },
      { x: 6, y: 6, w: 12, h: 4, color: hairBase },
      { x: 8, y: 4, w: 7, h: 1, color: hairHighlight },
      { x: 7, y: 8, w: 10, h: 1, color: hairShadow },
      { x: 5, y: 8, w: 2, h: 6, color: hairBase },
      { x: 17, y: 8, w: 2, h: 6, color: hairBase },
    );
  }

  return (
    <Svg width={size} height={(size * 30) / 24} viewBox="0 0 24 30">
      {pixels.map((p, index) => (
        <Rect
          key={`${p.x}-${p.y}-${index}`}
          x={p.x}
          y={p.y}
          width={p.w ?? 1}
          height={p.h ?? 1}
          fill={p.color}
        />
      ))}
    </Svg>
  );
}
