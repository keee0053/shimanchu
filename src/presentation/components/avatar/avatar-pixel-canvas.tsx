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
  const r = Math.max(0, parseInt(cleanHex.substring(0, 2), 16) - 40);
  const g = Math.max(0, parseInt(cleanHex.substring(2, 4), 16) - 40);
  const b = Math.max(0, parseInt(cleanHex.substring(4, 6), 16) - 40);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * カラーからハイライトを算出
 */
function getHighlightColor(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = Math.min(255, parseInt(cleanHex.substring(0, 2), 16) + 35);
  const g = Math.min(255, parseInt(cleanHex.substring(2, 4), 16) + 35);
  const b = Math.min(255, parseInt(cleanHex.substring(4, 6), 16) + 35);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 20x38規格の精密ピクセルアートアバター描画コンポーネント
 */
export function AvatarPixelCanvas({
  config,
  mode = 'standing',
  size = 200,
}: AvatarPixelCanvasProps) {
  const { skinTone, hairStyle, hairColor, eyeType, mouthType, outfit, glasses } = config;

  const outline = '#1C1917'; // 全体の黒枠・アウトライン
  const eyeColor = '#1A1A1A';
  const mouthColor = '#B86B52'; // 添付画像の自然な唇・口の色

  const skinBase = skinTone;
  const skinShadow = getShadowColor(skinTone);
  const skinHighlight = getHighlightColor(skinTone);

  const hairBase = hairColor;
  const hairShadow = getShadowColor(hairColor);
  const hairHighlight = getHighlightColor(hairColor);

  const pixels: PixelData[] = [];

  // ========================================================
  // 1. 体・首・頭部のベース（アウトラインと肌）
  // ========================================================
  // 首 (x: 9-10, y: 19-20)
  pixels.push(
    { x: 8, y: 19, w: 4, h: 2, color: outline },
    { x: 9, y: 19, w: 2, h: 2, color: skinShadow },
  );

  // 顔の黒枠アウトライン (x: 4〜15, y: 7〜19)
  pixels.push(
    // 顎・輪郭ライン
    { x: 7, y: 19, w: 6, h: 1, color: outline },
    { x: 5, y: 18, w: 2, h: 1, color: outline },
    { x: 13, y: 18, w: 2, h: 1, color: outline },
    { x: 4, y: 16, w: 1, h: 2, color: outline },
    { x: 15, y: 16, w: 1, h: 2, color: outline },
    // 側頭部
    { x: 4, y: 10, w: 1, h: 6, color: outline },
    { x: 15, y: 10, w: 1, h: 6, color: outline },
    // 耳のアウトラインと中身
    { x: 3, y: 13, w: 1, h: 3, color: outline },
    { x: 16, y: 13, w: 1, h: 3, color: outline },
    { x: 4, y: 13, w: 1, h: 2, color: skinBase },
    { x: 15, y: 13, w: 1, h: 2, color: skinBase },
    { x: 4, y: 15, w: 1, h: 1, color: skinShadow },
    { x: 15, y: 15, w: 1, h: 1, color: skinShadow },
  );

  // 顔の肌塗り（ベース・ハイライト・影）
  pixels.push(
    // 額・上部
    { x: 5, y: 8, w: 10, h: 2, color: skinHighlight },
    // 顔の中心部
    { x: 5, y: 10, w: 10, h: 6, color: skinBase },
    // 顎まわりのシャドウ
    { x: 5, y: 16, w: 10, h: 2, color: skinBase },
    { x: 6, y: 18, w: 8, h: 1, color: skinShadow },
    // ほっぺのチーク（淡いピンク）
    { x: 5, y: 14, w: 2, h: 1, color: '#F8B4B4' },
    { x: 13, y: 14, w: 2, h: 1, color: '#F8B4B4' },
  );

  // ========================================================
  // 2. 目・眉・口のディテール
  // ========================================================
  // 眉毛（髪色の影）
  pixels.push(
    { x: 6, y: 11, w: 2, h: 1, color: hairShadow },
    { x: 12, y: 11, w: 2, h: 1, color: hairShadow },
  );

  // 目
  if (eyeType === 'dots') {
    // 添付画像の点目（縦2x横2）
    pixels.push(
      { x: 6, y: 12, w: 2, h: 2, color: eyeColor },
      { x: 12, y: 12, w: 2, h: 2, color: eyeColor },
    );
  } else if (eyeType === 'smile') {
    // にっこり目（^^）
    pixels.push(
      { x: 6, y: 12, w: 2, h: 1, color: eyeColor },
      { x: 5, y: 13, w: 1, h: 1, color: eyeColor },
      { x: 8, y: 13, w: 1, h: 1, color: eyeColor },
      { x: 12, y: 12, w: 2, h: 1, color: eyeColor },
      { x: 11, y: 13, w: 1, h: 1, color: eyeColor },
      { x: 14, y: 13, w: 1, h: 1, color: eyeColor },
    );
  } else if (eyeType === 'calm') {
    // ジト目・クール細目
    pixels.push(
      { x: 5, y: 12, w: 3, h: 1, color: eyeColor },
      { x: 6, y: 13, w: 2, h: 1, color: eyeColor },
      { x: 12, y: 12, w: 3, h: 1, color: eyeColor },
      { x: 12, y: 13, w: 2, h: 1, color: eyeColor },
    );
  } else {
    // パッチリきらきら目
    pixels.push(
      { x: 6, y: 12, w: 2, h: 3, color: eyeColor },
      { x: 6, y: 12, w: 1, h: 1, color: '#FFFFFF' },
      { x: 12, y: 12, w: 2, h: 3, color: eyeColor },
      { x: 12, y: 12, w: 1, h: 1, color: '#FFFFFF' },
    );
  }

  // 口（添付画像にある繊細な口！）
  if (mouthType === 'neutral') {
    // 添付画像準拠：横2ドットの控えめな口
    pixels.push({ x: 9, y: 16, w: 2, h: 1, color: mouthColor });
  } else if (mouthType === 'smile') {
    // ほほえみ口（少し口角が上がった口）
    pixels.push(
      { x: 9, y: 16, w: 2, h: 1, color: mouthColor },
      { x: 8, y: 15, w: 1, h: 1, color: mouthColor },
      { x: 11, y: 15, w: 1, h: 1, color: mouthColor },
    );
  } else if (mouthType === 'open') {
    // 小さく開いた口
    pixels.push(
      { x: 9, y: 15, w: 2, h: 2, color: '#7E2A1E' },
      { x: 9, y: 16, w: 2, h: 1, color: '#E06D53' },
    );
  } else {
    // ひかえめ（1ドット）
    pixels.push({ x: 9, y: 16, w: 1, h: 1, color: mouthColor });
  }

  // ========================================================
  // 3. 服装・胴体・手足（立ち姿 / 漂流姿）
  // ========================================================
  if (mode === 'standing') {
    // ズボン（デニムジーンズ）
    const pantsOutline = '#1A252F';
    const pantsBase = '#2E4053';
    const pantsHighlight = '#34495E';
    pixels.push(
      // ズボンのアウトライン
      { x: 6, y: 29, w: 8, h: 1, color: pantsOutline },
      { x: 6, y: 30, w: 1, h: 5, color: pantsOutline },
      { x: 13, y: 30, w: 1, h: 5, color: pantsOutline },
      { x: 9, y: 31, w: 2, h: 4, color: pantsOutline }, // 股下スリット
      // デニムの塗り
      { x: 7, y: 29, w: 6, h: 2, color: pantsBase },
      { x: 7, y: 31, w: 2, h: 4, color: pantsHighlight },
      { x: 11, y: 31, w: 2, h: 4, color: pantsHighlight },
      { x: 7, y: 33, w: 2, h: 2, color: pantsBase },
      { x: 11, y: 33, w: 2, h: 2, color: pantsBase },
    );

    // 靴（白スニーカー＋グレーの底）
    pixels.push(
      // 左靴
      { x: 6, y: 35, w: 3, h: 2, color: outline },
      { x: 6, y: 35, w: 3, h: 1, color: '#FFFFFF' },
      { x: 6, y: 36, w: 3, h: 1, color: '#BDC3C7' },
      // 右靴
      { x: 11, y: 35, w: 3, h: 2, color: outline },
      { x: 11, y: 35, w: 3, h: 1, color: '#FFFFFF' },
      { x: 11, y: 36, w: 3, h: 1, color: '#BDC3C7' },
    );

    // 手（左右）
    pixels.push(
      // 左手
      { x: 4, y: 25, w: 2, h: 3, color: outline },
      { x: 4, y: 25, w: 2, h: 2, color: skinBase },
      { x: 4, y: 27, w: 1, h: 1, color: skinShadow },
      // 右手
      { x: 14, y: 25, w: 2, h: 3, color: outline },
      { x: 14, y: 25, w: 2, h: 2, color: skinBase },
      { x: 15, y: 27, w: 1, h: 1, color: skinShadow },
    );

    // トップス（各デザイン）
    if (outfit === 'border_navy' || outfit === 'border_white') {
      // 添付画像の爽やかボーダーTシャツ
      const stripeColor = outfit === 'border_navy' ? '#1B3A4B' : '#5DADE2';
      pixels.push(
        // 外枠
        { x: 6, y: 21, w: 8, h: 1, color: outline },
        { x: 5, y: 22, w: 1, h: 7, color: outline },
        { x: 14, y: 22, w: 1, h: 7, color: outline },
        { x: 6, y: 29, w: 8, h: 1, color: outline },
        // 白ベース
        { x: 6, y: 22, w: 8, h: 7, color: '#FFFFFF' },
        // ストライプライン
        { x: 6, y: 23, w: 8, h: 1, color: stripeColor },
        { x: 6, y: 25, w: 8, h: 1, color: stripeColor },
        { x: 6, y: 27, w: 8, h: 1, color: stripeColor },
        // 袖
        { x: 4, y: 22, w: 2, h: 3, color: outline },
        { x: 4, y: 23, w: 2, h: 2, color: '#FFFFFF' },
        { x: 14, y: 22, w: 2, h: 3, color: outline },
        { x: 14, y: 23, w: 2, h: 2, color: '#FFFFFF' },
      );
    } else if (outfit === 'hoodie_blue') {
      // ブルーパーカー
      const hoodieMain = '#3A86FF';
      const hoodieShadow = '#2667CC';
      pixels.push(
        { x: 5, y: 21, w: 10, h: 8, color: outline },
        { x: 6, y: 22, w: 8, h: 7, color: hoodieMain },
        // フード周り
        { x: 8, y: 21, w: 4, h: 1, color: hoodieShadow },
        // 紐
        { x: 8, y: 23, w: 1, h: 2, color: '#FFFFFF' },
        { x: 11, y: 23, w: 1, h: 2, color: '#FFFFFF' },
        // ポケット
        { x: 7, y: 26, w: 6, h: 2, color: hoodieShadow },
        // 袖
        { x: 4, y: 22, w: 2, h: 4, color: outline },
        { x: 4, y: 23, w: 2, h: 3, color: hoodieMain },
        { x: 14, y: 22, w: 2, h: 4, color: outline },
        { x: 14, y: 23, w: 2, h: 3, color: hoodieMain },
      );
    } else if (outfit === 'jacket_green') {
      // グリーンジャケット羽織り ＋ インナー
      const jacketColor = '#4CAF50';
      const jacketShadow = '#2E7D32';
      pixels.push(
        { x: 5, y: 21, w: 10, h: 8, color: outline },
        // インナー（白）
        { x: 8, y: 22, w: 4, h: 7, color: '#F2F4F4' },
        // 左右ジャケット
        { x: 6, y: 22, w: 2, h: 7, color: jacketColor },
        { x: 12, y: 22, w: 2, h: 7, color: jacketShadow },
        // 袖
        { x: 4, y: 22, w: 2, h: 4, color: outline },
        { x: 4, y: 23, w: 2, h: 3, color: jacketColor },
        { x: 14, y: 22, w: 2, h: 4, color: outline },
        { x: 14, y: 23, w: 2, h: 3, color: jacketShadow },
      );
    } else if (outfit === 'jacket_black') {
      // レザージャケット（黒）＋ 白インナー
      pixels.push(
        { x: 5, y: 21, w: 10, h: 8, color: outline },
        { x: 8, y: 22, w: 4, h: 7, color: '#FFFFFF' },
        { x: 6, y: 22, w: 2, h: 7, color: '#2C3E50' },
        { x: 12, y: 22, w: 2, h: 7, color: '#1A252F' },
        { x: 4, y: 22, w: 2, h: 4, color: outline },
        { x: 4, y: 23, w: 2, h: 3, color: '#2C3E50' },
        { x: 14, y: 22, w: 2, h: 4, color: outline },
        { x: 14, y: 23, w: 2, h: 3, color: '#1A252F' },
      );
    } else if (outfit === 'tshirt_red') {
      // 赤Tシャツ
      pixels.push(
        { x: 5, y: 21, w: 10, h: 8, color: outline },
        { x: 6, y: 22, w: 8, h: 7, color: '#E74C3C' },
        { x: 7, y: 22, w: 6, h: 1, color: '#C0392B' },
        { x: 4, y: 22, w: 2, h: 4, color: outline },
        { x: 4, y: 23, w: 2, h: 3, color: '#E74C3C' },
        { x: 14, y: 22, w: 2, h: 4, color: outline },
        { x: 14, y: 23, w: 2, h: 3, color: '#C0392B' },
      );
    } else if (outfit === 'tshirt_white') {
      // 白Tシャツ
      pixels.push(
        { x: 5, y: 21, w: 10, h: 8, color: outline },
        { x: 6, y: 22, w: 8, h: 7, color: '#FFFFFF' },
        { x: 7, y: 28, w: 6, h: 1, color: '#BDC3C7' },
        { x: 4, y: 22, w: 2, h: 4, color: outline },
        { x: 4, y: 23, w: 2, h: 3, color: '#FFFFFF' },
        { x: 14, y: 22, w: 2, h: 4, color: outline },
        { x: 14, y: 23, w: 2, h: 3, color: '#BDC3C7' },
      );
    } else {
      // ダークロゴT
      pixels.push(
        { x: 5, y: 21, w: 10, h: 8, color: outline },
        { x: 6, y: 22, w: 8, h: 7, color: '#2C3E50' },
        { x: 9, y: 24, w: 2, h: 2, color: '#2ECC71' }, // ロゴ
        { x: 4, y: 22, w: 2, h: 4, color: outline },
        { x: 4, y: 23, w: 2, h: 3, color: '#2C3E50' },
        { x: 14, y: 22, w: 2, h: 4, color: outline },
        { x: 14, y: 23, w: 2, h: 3, color: '#1A252F' },
      );
    }
  } else {
    // ========================================================
    // 漂流姿（浮き輪に乗って海に浮いているモード）
    // ========================================================
    // 上半身
    pixels.push(
      { x: 6, y: 21, w: 8, h: 4, color: '#3A86FF' },
      // 浮き輪をつかむ手
      { x: 3, y: 21, w: 2, h: 2, color: skinBase },
      { x: 15, y: 21, w: 2, h: 2, color: skinBase },
    );

    // 浮き輪（赤白ストライプのドーナツ型）
    const tubeRed = '#E74C3C';
    const tubeWhite = '#FFFFFF';
    pixels.push(
      // 浮き輪のアウトライン
      { x: 2, y: 23, w: 16, h: 7, color: outline },
      // 赤白ストライプ
      { x: 3, y: 24, w: 14, h: 5, color: tubeRed },
      { x: 6, y: 24, w: 2, h: 5, color: tubeWhite },
      { x: 12, y: 24, w: 2, h: 5, color: tubeWhite },
      { x: 3, y: 25, w: 2, h: 3, color: tubeWhite },
      { x: 15, y: 25, w: 2, h: 3, color: tubeWhite },
      // 浮き輪の内側の穴（水が見える）
      { x: 7, y: 26, w: 6, h: 2, color: '#2980B9' },
    );

    // 周りの波と水しぶき
    pixels.push(
      { x: 1, y: 30, w: 18, h: 2, color: '#3498DB' },
      { x: 0, y: 32, w: 20, h: 4, color: '#2980B9' },
      { x: 2, y: 30, w: 3, h: 1, color: '#EBF5FB' },
      { x: 15, y: 30, w: 3, h: 1, color: '#EBF5FB' },
    );
  }

  // ========================================================
  // 4. メガネ・小物
  // ========================================================
  if (glasses === 'glasses_round') {
    const frame = '#5D4037';
    pixels.push(
      // 左レンズ枠
      { x: 5, y: 11, w: 4, h: 4, color: frame },
      { x: 6, y: 12, w: 2, h: 2, color: skinBase },
      // 右レンズ枠
      { x: 11, y: 11, w: 4, h: 4, color: frame },
      { x: 12, y: 12, w: 2, h: 2, color: skinBase },
      // ブリッジ
      { x: 9, y: 12, w: 2, h: 1, color: frame },
    );
  } else if (glasses === 'glasses_square') {
    const frame = '#1C1917';
    pixels.push(
      { x: 5, y: 11, w: 4, h: 3, color: frame },
      { x: 6, y: 12, w: 2, h: 1, color: '#FFFFFF' }, // レンズ光
      { x: 11, y: 11, w: 4, h: 3, color: frame },
      { x: 12, y: 12, w: 2, h: 1, color: '#FFFFFF' },
      { x: 9, y: 12, w: 2, h: 1, color: frame },
    );
  }

  // ========================================================
  // 5. 髪型・帽子（添付画像に忠実な9パターン）
  // ========================================================
  if (hairStyle === 'cap_forward') {
    // ベースボールキャップ（ツバ前・赤白）
    pixels.push(
      // 帽子アウトライン
      { x: 4, y: 3, w: 12, h: 6, color: outline },
      // クラウン（赤）
      { x: 5, y: 4, w: 10, h: 4, color: '#E74C3C' },
      // フロントパネル（白）
      { x: 8, y: 4, w: 4, h: 4, color: '#FFFFFF' },
      // ツバ（黒枠＋濃赤）
      { x: 3, y: 8, w: 14, h: 2, color: outline },
      { x: 4, y: 8, w: 12, h: 1, color: '#C0392B' },
      // もみあげ
      { x: 4, y: 10, w: 1, h: 4, color: hairBase },
      { x: 15, y: 10, w: 1, h: 4, color: hairBase },
    );
  } else if (hairStyle === 'cap_backward') {
    // キャップ（後ろかぶり・緑/ストリート風）
    pixels.push(
      { x: 4, y: 4, w: 12, h: 5, color: outline },
      { x: 5, y: 5, w: 10, h: 3, color: '#27AE60' },
      { x: 8, y: 7, w: 4, h: 1, color: '#1E8449' }, // 後ろアジャスター
      // 前髪チラ見せ
      { x: 6, y: 8, w: 3, h: 2, color: hairBase },
      { x: 11, y: 8, w: 3, h: 2, color: hairBase },
      { x: 4, y: 10, w: 1, h: 4, color: hairBase },
      { x: 15, y: 10, w: 1, h: 4, color: hairBase },
    );
  } else if (hairStyle === 'short_messy') {
    // 添付画像2番目：無造作ショート（毛先が跳ねている）
    pixels.push(
      // アウトライン
      { x: 4, y: 4, w: 12, h: 7, color: outline },
      { x: 3, y: 6, w: 2, h: 3, color: outline },
      { x: 15, y: 3, w: 3, h: 3, color: outline }, // 右上の跳ね毛
      // メイン髪塗り
      { x: 5, y: 5, w: 10, h: 5, color: hairBase },
      { x: 6, y: 4, w: 8, h: 1, color: hairHighlight }, // ハイライト
      { x: 15, y: 4, w: 2, h: 2, color: hairHighlight },
      // 前髪ギザギザ
      { x: 5, y: 9, w: 3, h: 2, color: hairShadow },
      { x: 9, y: 9, w: 2, h: 2, color: hairShadow },
      { x: 12, y: 9, w: 3, h: 2, color: hairShadow },
      // もみあげ
      { x: 4, y: 10, w: 1, h: 4, color: hairShadow },
      { x: 15, y: 10, w: 1, h: 4, color: hairShadow },
    );
  } else if (hairStyle === 'mush') {
    // マッシュ（丸みのある前髪）
    pixels.push(
      { x: 4, y: 4, w: 12, h: 7, color: outline },
      { x: 5, y: 5, w: 10, h: 5, color: hairBase },
      { x: 6, y: 5, w: 8, h: 1, color: hairHighlight },
      // 丸く揃った前髪
      { x: 5, y: 9, w: 10, h: 2, color: hairShadow },
      { x: 4, y: 10, w: 2, h: 4, color: hairShadow },
      { x: 14, y: 10, w: 2, h: 4, color: hairShadow },
    );
  } else if (hairStyle === 'center_part') {
    // センターパート（真ん中分け・サラサラ）
    pixels.push(
      { x: 4, y: 4, w: 12, h: 7, color: outline },
      { x: 5, y: 5, w: 10, h: 4, color: hairBase },
      { x: 5, y: 5, w: 4, h: 2, color: hairHighlight },
      { x: 11, y: 5, w: 4, h: 2, color: hairHighlight },
      // センターの分け目（肌が見える）
      { x: 9, y: 7, w: 2, h: 3, color: skinBase },
      // サイドに流れる前髪
      { x: 5, y: 8, w: 3, h: 3, color: hairShadow },
      { x: 12, y: 8, w: 3, h: 3, color: hairShadow },
      { x: 4, y: 10, w: 1, h: 4, color: hairShadow },
      { x: 15, y: 10, w: 1, h: 4, color: hairShadow },
    );
  } else if (hairStyle === 'long_straight') {
    // 添付画像5番目：ロングストレート（肩まで届く髪）
    pixels.push(
      { x: 4, y: 4, w: 12, h: 7, color: outline },
      { x: 5, y: 5, w: 10, h: 5, color: hairBase },
      { x: 6, y: 5, w: 8, h: 1, color: hairHighlight },
      { x: 6, y: 9, w: 8, h: 2, color: hairShadow },
      // 肩にかかる長いサイドヘア
      { x: 3, y: 9, w: 2, h: 15, color: outline },
      { x: 3, y: 10, w: 2, h: 13, color: hairBase },
      { x: 4, y: 11, w: 1, h: 12, color: hairShadow },
      { x: 15, y: 9, w: 2, h: 15, color: outline },
      { x: 15, y: 10, w: 2, h: 13, color: hairBase },
      { x: 15, y: 11, w: 1, h: 12, color: hairShadow },
    );
  } else if (hairStyle === 'wavy') {
    // 添付画像11番目：ウェーブ・パーマ
    pixels.push(
      { x: 3, y: 4, w: 14, h: 8, color: outline },
      { x: 4, y: 5, w: 12, h: 6, color: hairBase },
      { x: 5, y: 5, w: 4, h: 2, color: hairHighlight },
      { x: 11, y: 5, w: 4, h: 2, color: hairHighlight },
      { x: 5, y: 9, w: 10, h: 2, color: hairShadow },
      // もこもこウェーブサイド
      { x: 3, y: 9, w: 2, h: 10, color: hairBase },
      { x: 15, y: 9, w: 2, h: 10, color: hairBase },
    );
  } else if (hairStyle === 'spiky') {
    // スパイキー（ツンツン）
    pixels.push(
      { x: 6, y: 2, w: 2, h: 3, color: hairHighlight },
      { x: 9, y: 1, w: 2, h: 4, color: hairHighlight },
      { x: 12, y: 2, w: 2, h: 3, color: hairHighlight },
      { x: 4, y: 5, w: 12, h: 6, color: outline },
      { x: 5, y: 5, w: 10, h: 5, color: hairBase },
      { x: 5, y: 9, w: 10, h: 2, color: hairShadow },
      { x: 4, y: 10, w: 1, h: 3, color: hairShadow },
      { x: 15, y: 10, w: 1, h: 3, color: hairShadow },
    );
  } else {
    // ボブ
    pixels.push(
      { x: 4, y: 4, w: 12, h: 7, color: outline },
      { x: 5, y: 5, w: 10, h: 5, color: hairBase },
      { x: 6, y: 5, w: 8, h: 1, color: hairHighlight },
      { x: 5, y: 9, w: 10, h: 2, color: hairShadow },
      { x: 3, y: 10, w: 2, h: 8, color: hairBase },
      { x: 15, y: 10, w: 2, h: 8, color: hairBase },
    );
  }

  return (
    <Svg width={size} height={(size * 38) / 20} viewBox="0 0 20 38">
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
