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
 * カラーから影（ダークトーン）を算出
 */
function getShadowColor(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = Math.max(0, parseInt(cleanHex.substring(0, 2), 16) - 35);
  const g = Math.max(0, parseInt(cleanHex.substring(2, 4), 16) - 35);
  const b = Math.max(0, parseInt(cleanHex.substring(4, 6), 16) - 35);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * カラーからハイライトを算出
 */
function getHighlightColor(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = Math.min(255, parseInt(cleanHex.substring(0, 2), 16) + 30);
  const g = Math.min(255, parseInt(cleanHex.substring(2, 4), 16) + 30);
  const b = Math.min(255, parseInt(cleanHex.substring(4, 6), 16) + 30);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 16x28ピクセル規格の Simple Human Avatars 再現コンポーネント
 */
export function AvatarPixelCanvas({
  config,
  mode = 'standing',
  size = 180,
}: AvatarPixelCanvasProps) {
  const { skinTone, hairStyle, hairColor, eyeType, outfit, hasGlasses } = config;

  const outline = '#262626'; // 黒のアウトライン
  const eyeColor = '#171717';
  const mouthColor = '#B86B52'; // 添付画像の自然な口色

  const skinBase = skinTone;
  const skinShadow = getShadowColor(skinTone);
  const skinHighlight = getHighlightColor(skinTone);

  const hairBase = hairColor;
  const hairShadow = getShadowColor(hairColor);
  const hairHighlight = getHighlightColor(hairColor);

  const pixels: PixelData[] = [];

  // ==========================================
  // 1. 素体ベース（頭部・顔・肌）
  // ==========================================
  // 顔のアウトライン (黒枠)
  pixels.push(
    { x: 3, y: 5, w: 10, h: 8, color: outline },
    { x: 2, y: 7, w: 12, h: 5, color: outline },
    { x: 4, y: 12, w: 8, h: 1, color: outline },
    // 首のアウトライン
    { x: 6, y: 13, w: 4, h: 1, color: outline },
  );

  // 顔の肌塗り
  pixels.push(
    // 額・ハイライト
    { x: 4, y: 6, w: 8, h: 2, color: skinHighlight },
    // 顔の中心部
    { x: 3, y: 7, w: 10, h: 4, color: skinBase },
    // 顎・影
    { x: 4, y: 11, w: 8, h: 1, color: skinShadow },
    // 耳（左右）
    { x: 2, y: 8, w: 1, h: 2, color: skinBase },
    { x: 13, y: 8, w: 1, h: 2, color: skinBase },
    // ほっぺのチーク（淡いピンク）
    { x: 3, y: 9, w: 1, h: 1, color: '#F8B4B4' },
    { x: 12, y: 9, w: 1, h: 1, color: '#F8B4B4' },
    // 首
    { x: 7, y: 13, w: 2, h: 1, color: skinShadow },
  );

  // ==========================================
  // 2. 目 ＆ 口（表情）
  // ==========================================
  // 口（添付画像にある目から2ドット下の小さな控えめな口）
  pixels.push({ x: 7, y: 10, w: 2, h: 1, color: mouthColor });

  // 目
  if (eyeType === 'dots') {
    // 添付画像の点目（縦2x横1の黒目）
    pixels.push(
      { x: 5, y: 8, w: 1, h: 2, color: eyeColor },
      { x: 10, y: 8, w: 1, h: 2, color: eyeColor },
    );
  } else if (eyeType === 'smile') {
    // にっこり目 ^^
    pixels.push(
      { x: 5, y: 8, w: 2, h: 1, color: eyeColor },
      { x: 4, y: 9, w: 1, h: 1, color: eyeColor },
      { x: 10, y: 8, w: 2, h: 1, color: eyeColor },
      { x: 11, y: 9, w: 1, h: 1, color: eyeColor },
    );
  } else if (eyeType === 'calm') {
    // ジト目・細目
    pixels.push(
      { x: 4, y: 8, w: 2, h: 1, color: eyeColor },
      { x: 10, y: 8, w: 2, h: 1, color: eyeColor },
    );
  } else {
    // パッチリ丸目
    pixels.push(
      { x: 5, y: 8, w: 1, h: 2, color: eyeColor },
      { x: 5, y: 8, w: 1, h: 1, color: '#FFFFFF' },
      { x: 10, y: 8, w: 1, h: 2, color: eyeColor },
      { x: 10, y: 8, w: 1, h: 1, color: '#FFFFFF' },
    );
  }

  // ==========================================
  // 3. 服装・手足（立ち姿 / 漂流姿）
  // ==========================================
  if (mode === 'standing') {
    // ズボン（デニムジーンズ）
    const pantsOutline = '#1A252F';
    const pantsBase = '#2E4053';
    const pantsHighlight = '#34495E';
    pixels.push(
      // アウトライン
      { x: 4, y: 20, w: 8, h: 4, color: pantsOutline },
      { x: 7, y: 21, w: 2, h: 3, color: outline }, // 股下スリット
      // デニム塗り
      { x: 5, y: 20, w: 2, h: 4, color: pantsHighlight },
      { x: 9, y: 20, w: 2, h: 4, color: pantsHighlight },
      { x: 5, y: 22, w: 2, h: 2, color: pantsBase },
      { x: 9, y: 22, w: 2, h: 2, color: pantsBase },
    );

    // 靴（白スニーカー＋グレー底）
    pixels.push(
      // 左足
      { x: 4, y: 24, w: 3, h: 2, color: outline },
      { x: 4, y: 24, w: 3, h: 1, color: '#FFFFFF' },
      { x: 4, y: 25, w: 3, h: 1, color: '#9E9E9E' },
      // 右足
      { x: 9, y: 24, w: 3, h: 2, color: outline },
      { x: 9, y: 24, w: 3, h: 1, color: '#FFFFFF' },
      { x: 9, y: 25, w: 3, h: 1, color: '#9E9E9E' },
    );

    // 手（左右）
    pixels.push(
      { x: 2, y: 17, w: 1, h: 2, color: outline },
      { x: 2, y: 17, w: 1, h: 1, color: skinBase },
      { x: 13, y: 17, w: 1, h: 2, color: outline },
      { x: 13, y: 17, w: 1, h: 1, color: skinBase },
    );

    // トップス
    if (outfit === 'stripe') {
      // 添付画像の爽やかボーダーTシャツ（白＋青ストライプ）
      const stripeBlue = '#244F75';
      pixels.push(
        // アウトライン
        { x: 3, y: 14, w: 10, h: 6, color: outline },
        { x: 2, y: 15, w: 12, h: 3, color: outline },
        // 白ベース
        { x: 4, y: 14, w: 8, h: 6, color: '#FFFFFF' },
        { x: 3, y: 15, w: 1, h: 2, color: '#FFFFFF' },
        { x: 12, y: 15, w: 1, h: 2, color: '#FFFFFF' },
        // ストライプライン
        { x: 4, y: 15, w: 8, h: 1, color: stripeBlue },
        { x: 4, y: 17, w: 8, h: 1, color: stripeBlue },
        { x: 4, y: 19, w: 8, h: 1, color: stripeBlue },
      );
    } else if (outfit === 'hoodie') {
      // ブルーパーカー
      const hoodieMain = '#3A86FF';
      const hoodieShadow = '#2563EB';
      pixels.push(
        { x: 3, y: 14, w: 10, h: 6, color: outline },
        { x: 2, y: 15, w: 12, h: 3, color: outline },
        { x: 4, y: 14, w: 8, h: 6, color: hoodieMain },
        // フード紐
        { x: 6, y: 15, w: 1, h: 2, color: '#FFFFFF' },
        { x: 9, y: 15, w: 1, h: 2, color: '#FFFFFF' },
        // ポケット
        { x: 5, y: 18, w: 6, h: 1, color: hoodieShadow },
      );
    } else if (outfit === 'jacket') {
      // グリーンジャケット ＋ 白インナー
      const jacketColor = '#388E3C';
      const jacketShadow = '#2E7D32';
      pixels.push(
        { x: 3, y: 14, w: 10, h: 6, color: outline },
        { x: 2, y: 15, w: 12, h: 3, color: outline },
        // 白インナー
        { x: 7, y: 14, w: 2, h: 6, color: '#F5F5F5' },
        // 左右ジャケット
        { x: 4, y: 14, w: 3, h: 6, color: jacketColor },
        { x: 9, y: 14, w: 3, h: 6, color: jacketShadow },
        { x: 3, y: 15, w: 1, h: 2, color: jacketColor },
        { x: 12, y: 15, w: 1, h: 2, color: jacketShadow },
      );
    } else {
      // 白無地Tシャツ
      pixels.push(
        { x: 3, y: 14, w: 10, h: 6, color: outline },
        { x: 2, y: 15, w: 12, h: 3, color: outline },
        { x: 4, y: 14, w: 8, h: 6, color: '#FFFFFF' },
        { x: 3, y: 15, w: 1, h: 2, color: '#E0E0E0' },
        { x: 12, y: 15, w: 1, h: 2, color: '#E0E0E0' },
        { x: 5, y: 19, w: 6, h: 1, color: '#E0E0E0' },
      );
    }
  } else {
    // ==========================================
    // 漂流姿（浮き輪に乗っている）
    // ==========================================
    // 上半身
    pixels.push({ x: 4, y: 14, w: 8, h: 4, color: '#3A86FF' });

    // 浮き輪（赤白ストライプ）
    const tubeRed = '#EF4444';
    const tubeWhite = '#FFFFFF';
    pixels.push(
      // アウトライン
      { x: 1, y: 17, w: 14, h: 6, color: outline },
      // 浮き輪赤ベース
      { x: 2, y: 18, w: 12, h: 4, color: tubeRed },
      // 白ストライプ
      { x: 4, y: 18, w: 2, h: 4, color: tubeWhite },
      { x: 10, y: 18, w: 2, h: 4, color: tubeWhite },
    );

    // 波しぶき
    pixels.push(
      { x: 0, y: 22, w: 16, h: 2, color: '#0EA5E9' },
      { x: 0, y: 24, w: 16, h: 3, color: '#0284C7' },
      { x: 2, y: 22, w: 3, h: 1, color: '#E0F2FE' },
      { x: 11, y: 22, w: 3, h: 1, color: '#E0F2FE' },
    );
  }

  // ==========================================
  // 4. メガネ・小物
  // ==========================================
  if (hasGlasses) {
    const frame = '#171717';
    pixels.push(
      // 左枠
      { x: 4, y: 7, w: 3, h: 3, color: frame },
      { x: 5, y: 8, w: 1, h: 1, color: skinBase },
      // 右枠
      { x: 9, y: 7, w: 3, h: 3, color: frame },
      { x: 10, y: 8, w: 1, h: 1, color: skinBase },
      // ブリッジ
      { x: 7, y: 8, w: 2, h: 1, color: frame },
    );
  }

  // ==========================================
  // 5. 髪型（添付画像に忠実なドット配置）
  // ==========================================
  if (hairStyle === 'cap_forward') {
    // 赤白ベースボールキャップ
    pixels.push(
      // アウトライン
      { x: 3, y: 2, w: 10, h: 5, color: outline },
      { x: 2, y: 6, w: 12, h: 2, color: outline },
      // 赤クラウン
      { x: 4, y: 3, w: 8, h: 3, color: '#E53935' },
      // 白フロントパネル
      { x: 6, y: 3, w: 4, h: 3, color: '#FFFFFF' },
      // ツバ
      { x: 3, y: 6, w: 10, h: 1, color: '#C62828' },
      // もみあげ
      { x: 3, y: 7, w: 1, h: 3, color: hairBase },
      { x: 12, y: 7, w: 1, h: 3, color: hairBase },
    );
  } else if (hairStyle === 'cap_backward') {
    // 後ろかぶりキャップ（青/緑）
    pixels.push(
      { x: 3, y: 3, w: 10, h: 4, color: outline },
      { x: 4, y: 4, w: 8, h: 2, color: '#1E88E5' },
      { x: 7, y: 5, w: 2, h: 1, color: '#1565C0' }, // アジャスター
      // 前髪
      { x: 4, y: 6, w: 3, h: 1, color: hairBase },
      { x: 9, y: 6, w: 3, h: 1, color: hairBase },
      { x: 3, y: 7, w: 1, h: 3, color: hairBase },
      { x: 12, y: 7, w: 1, h: 3, color: hairBase },
    );
  } else if (hairStyle === 'short') {
    // 無造作ショート（画像2番目）
    pixels.push(
      // アウトライン
      { x: 3, y: 2, w: 10, h: 6, color: outline },
      { x: 2, y: 4, w: 12, h: 4, color: outline },
      { x: 12, y: 1, w: 2, h: 2, color: outline }, // 右上のハネ毛
      // メイン髪
      { x: 4, y: 3, w: 8, h: 4, color: hairBase },
      { x: 5, y: 2, w: 6, h: 1, color: hairHighlight },
      { x: 12, y: 2, w: 1, h: 1, color: hairHighlight },
      // 前髪（ギザギザ）
      { x: 4, y: 6, w: 2, h: 1, color: hairShadow },
      { x: 7, y: 6, w: 2, h: 1, color: hairShadow },
      { x: 10, y: 6, w: 2, h: 1, color: hairShadow },
      // もみあげ
      { x: 3, y: 7, w: 1, h: 3, color: hairShadow },
      { x: 12, y: 7, w: 1, h: 3, color: hairShadow },
    );
  } else if (hairStyle === 'mush') {
    // マッシュ（丸みのある前髪）
    pixels.push(
      { x: 3, y: 2, w: 10, h: 6, color: outline },
      { x: 2, y: 4, w: 12, h: 4, color: outline },
      { x: 4, y: 3, w: 8, h: 4, color: hairBase },
      { x: 5, y: 2, w: 6, h: 1, color: hairHighlight },
      // まっすぐ揃った前髪
      { x: 4, y: 6, w: 8, h: 1, color: hairShadow },
      { x: 3, y: 7, w: 1, h: 3, color: hairShadow },
      { x: 12, y: 7, w: 1, h: 3, color: hairShadow },
    );
  } else if (hairStyle === 'center_part') {
    // センター分け
    pixels.push(
      { x: 3, y: 2, w: 10, h: 6, color: outline },
      { x: 2, y: 4, w: 12, h: 4, color: outline },
      { x: 4, y: 3, w: 8, h: 4, color: hairBase },
      { x: 4, y: 3, w: 3, h: 1, color: hairHighlight },
      { x: 9, y: 3, w: 3, h: 1, color: hairHighlight },
      // 分け目（肌が見える）
      { x: 7, y: 4, w: 2, h: 3, color: skinBase },
      // サイドに流れる前髪
      { x: 4, y: 6, w: 2, h: 2, color: hairShadow },
      { x: 10, y: 6, w: 2, h: 2, color: hairShadow },
    );
  } else if (hairStyle === 'long') {
    // ロングストレート（画像5番目）
    pixels.push(
      { x: 3, y: 2, w: 10, h: 6, color: outline },
      { x: 2, y: 4, w: 12, h: 4, color: outline },
      { x: 4, y: 3, w: 8, h: 4, color: hairBase },
      { x: 5, y: 2, w: 6, h: 1, color: hairHighlight },
      { x: 5, y: 6, w: 6, h: 1, color: hairShadow },
      // 肩にかかる長いサイドヘア
      { x: 2, y: 7, w: 2, h: 11, color: outline },
      { x: 2, y: 8, w: 2, h: 9, color: hairBase },
      { x: 12, y: 7, w: 2, h: 11, color: outline },
      { x: 12, y: 8, w: 2, h: 9, color: hairBase },
    );
  } else {
    // ウェーブ（画像12番目）
    pixels.push(
      { x: 2, y: 2, w: 12, h: 7, color: outline },
      { x: 3, y: 3, w: 10, h: 5, color: hairBase },
      { x: 4, y: 2, w: 4, h: 2, color: hairHighlight },
      { x: 8, y: 2, w: 4, h: 2, color: hairHighlight },
      { x: 4, y: 6, w: 8, h: 1, color: hairShadow },
      // もこもこサイド
      { x: 2, y: 7, w: 2, h: 8, color: hairBase },
      { x: 12, y: 7, w: 2, h: 8, color: hairBase },
    );
  }

  return (
    <Svg width={size} height={(size * 28) / 16} viewBox="0 0 16 28">
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
