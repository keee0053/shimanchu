import React, { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';

import type {
  AvatarConfig,
  AvatarPreviewMode,
  HairStyle,
  OutfitType,
} from '@/domain/entities/avatar';

interface AvatarPixelCanvasProps {
  config: AvatarConfig;
  mode?: AvatarPreviewMode;
  size?: number;
}

interface HairLayerTemplate {
  back?: readonly string[];
  front: readonly string[];
  palette?: Record<string, string>;
}

const GRID_W = 20;
const GRID_H = 38;

/**
 * 数値を 0〜255 の整数範囲に丸める
 */
function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/**
 * HEXカラーコード（#RRGGBB）を RGB 配列に変換する
 */
function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
}

/**
 * RGB の各チャンネル値を HEXカラーコード（#rrggbb）に変換する
 */
function toHex(r: number, g: number, b: number): string {
  return `#${clampByte(r).toString(16).padStart(2, '0')}${clampByte(g).toString(16).padStart(2, '0')}${clampByte(b).toString(16).padStart(2, '0')}`;
}

/**
 * HEXカラーコードの各RGBチャンネルにオフセットを加算して明暗を調整する
 */
function shiftRgb(hex: string, dr: number, dg: number, db: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex(r + dr, g + dg, b + db);
}

/**
 * HEXカラーコードの各RGBチャンネルを倍率スケーリングして陰影色を生成する
 */
function scaleRgb(hex: string, factor: number, add = 0): string {
  const [r, g, b] = parseHex(hex);
  return toHex(r * factor + add, g * factor + add, b * factor + add);
}

/**
 * Simple Human Avatars の肌色グラデーション対応表を生成
 */
function buildSkinPalette(skinTone: string): Record<string, string> {
  return {
    '#': '#16070A',
    C: shiftRgb(skinTone, -110, -118, -108),
    K: shiftRgb(skinTone, -98, -94, -85),
    D: shiftRgb(skinTone, -42, -52, -46),
    S: shiftRgb(skinTone, -16, -24, -22),
    B: skinTone,
    H: shiftRgb(skinTone, 10, 12, 12),
    M: shiftRgb(skinTone, -68, -82, -74),
  };
}

/**
 * Simple Human Avatars の5段階ヘアシェーディング対応表を生成
 */
function buildHairPalette(hairColor: string): Record<string, string> {
  return {
    '#': scaleRgb(hairColor, 0.22, 4),
    D: scaleRgb(hairColor, 0.52, 4),
    S: scaleRgb(hairColor, 0.78, 2),
    B: hairColor,
    H: shiftRgb(hairColor, 26, 24, 28),
  };
}

/**
 * 素体（頭部・顔・耳・首）テンプレート（rows 9..19, 20文字幅）
 * '.' = 透明, '#' = 輪郭, 'C' = 耳穴/濃い影, 'K' = 顎角影, 'D' = 濃い肌影, 'S' = 肌影, 'B' = 基本肌, 'H' = ハイライト肌
 */
const HEAD_TEMPLATE: readonly string[] = [
  '....##########......', // r09
  '...#DDDDDDDDDD#.....', // r10
  '..#DSBBBBBBBBSD#....', // r11
  '.#DSBBBBBBBBBBSD#...', // r12
  '#SCDBHBBBBBBHBDCDS..', // r13
  '#SCBBHBBBBBBHBBCSB#.', // r14
  '#SCBBHBBBBBBHBBCSB#.', // r15
  '.##SBBBBBBBBBBBS##..', // r16
  '..##SBBBBBBBBBS##...', // r17
  '...##KSSSSSSSK##....', // r18
  '....###########.....', // r19
];

/**
 * 髪型・帽子テンプレート（20文字幅、r01から開始）
 * back: 顔・胴体の背面に描画するレイヤー
 * front: 顔・胴体の前面に描画するレイヤー
 * '.' = 透明, '#' = アウトライン, 'D' = 深い影, 'S' = 影, 'B' = ベース髪色, 'H' = ハイライト
 */
const HAIR_TEMPLATES: Record<HairStyle, HairLayerTemplate> = {
  // マッシュ（丸みのあるシルエット＋自然な前髪グラデーション）
  mush: {
    front: [
      '....................', // r01
      '.....#########......', // r02
      '....#SBBBBBBBS#.....', // r03
      '...#BHBBBBBBBBB#....', // r04
      '..#BBHHBBBBBBBBB#...', // r05
      '.##BSHHBBBBSBBSB#...', // r06
      '.#DSBSBSSSSSBSSS#...', // r07
      '.#DSSSSSSSSSSSSSS#..', // r08
      '.#SSDDDDDDDDDDDSS#..', // r09
      '.#SDD.........DDS#..', // r10
      '.#SD...........DS#..', // r11
      '.#D............DD#..', // r12
      '..#............D#...', // r13
    ],
  },
  // ショート（動きのある無造作ショート＋アシンメトリーな前髪）
  short: {
    front: [
      '....................', // r01
      '.......#####........', // r02
      '.....##DSSSS###.....', // r03
      '...###SSBBBBBBS####.', // r04
      '..#SSDSBBBBBBBBBSS#.', // r05
      '.#SBBSBBBBBBBBBBD#..', // r06
      '##BHHSSSBSSBBSBBB#..', // r07
      '#SBBHSDSHSDSBHSBBSD.', // r08
      '#BSSS#.#SSDSSBHDSB##', // r09
      '#SDB#...#D#DDBBBSS##', // r10
      'DS#SD....D..##SSD##.', // r11
      '##S#..........DSD#..', // r12
      '..##...........D#...', // r13
    ],
  },
  // センター分け（額が覗く上品なパートヘア）
  center_part: {
    front: [
      '....................', // r01
      '........######......', // r02
      '......##SBBBBD##....', // r03
      '....###SBBBBBBBS#...', // r04
      '...#BSDBBBBHBHBHB#..', // r05
      '..#SBBDBBBBBHBHHHS#.', // r06
      '..DBHBDSBBBBHHHBHH#.', // r07
      '.#BHBSD#DBHHBBHHBHS#', // r08
      '.#BHSD...#SHHBBHBSB#', // r09
      '.#BSD.....#DSBBBBSB#', // r10
      '.#SD........DDDBBSS#', // r11
      '.#SD...........DBS##', // r12
      '..#D...........SD...', // r13
    ],
  },
  // ロング（肩まで降りるストレートロング：背面レイヤーと前面レイヤーに分割）
  long: {
    back: [
      '....................', // r01
      '....................', // r02
      '....................', // r03
      '....................', // r04
      '....................', // r05
      '....................', // r06
      '....................', // r07
      '....................', // r08
      '....................', // r09
      '....................', // r10
      '....................', // r11
      '....................', // r12
      '#BBD...........DBB#.', // r13
      '#BBD...........DBB#.', // r14
      '#BBD...........DBB#.', // r15
      '#BBD...........#BB#.', // r16
      '#BBD...........#BB#.', // r17
      '#BBS...........DBB#.', // r18
    ],
    front: [
      '....................', // r01
      '......#######.......', // r02
      '....##SSBBBBS##.....', // r03
      '...#SBBBBBBBBSD#....', // r04
      '..#SHBBBBBBBBBBS#...', // r05
      '.#SBHBBBBBBBSBBHS#..', // r06
      '.#SHBBBBBBBBDBSHH#..', // r07
      '#BHBHSHHBHHS#BHBHB#.', // r08
      '#SHBBHBBHHBD.DBBBB#.', // r09
      '#BBBBBBBBDD...DBBB#.', // r10
      '#BBBBSDD#.....DBBB#.', // r11
      '#BBSDD.........DBB#.', // r12
      '#BB.............BB#.', // r13
      '#BB.............BB#.', // r14
      '#BB.............BB#.', // r15
      '....................', // r16
      '....................', // r17
      '....................', // r18
      '#BBD...........DBB#.', // r19
      '#SSD...........DSH#.', // r20
      '#SB#...........#BS#.', // r21
    ],
  },
  // ウェーブ（ふんわりボリュームのセミロングウェーブ：背面レイヤーと前面レイヤーに分割）
  wavy: {
    back: [
      '....................', // r01
      '....................', // r02
      '....................', // r03
      '....................', // r04
      '....................', // r05
      '....................', // r06
      '....................', // r07
      '....................', // r08
      '....................', // r09
      '....................', // r10
      '....................', // r11
      '....................', // r12
      '#SBS...........DSBB#', // r13
      '#SHD...........DSSB#', // r14
      '#SHD...........DSSB#', // r15
      '#SBD...........SDSB#', // r16
      '#SS#...........#SSS#', // r17
      '#SSD...........SDSS#', // r18
    ],
    front: [
      '....................', // r01
      '......########......', // r02
      '....##DBBBBBBS##....', // r03
      '...#DBBBBBBBBBBD#...', // r04
      '..#BBBBBBBBBBBBBS#..', // r05
      '.##BHBHBBBBBBBBBB##.', // r06
      '.#HHBHBBHBBHSBBHBH#.', // r07
      '#DBBHBSHBSHBDBHSHHD#', // r08
      '#BBBBSBBSBBSHSHHSBBD', // r09
      '#BSBSBBSDBD..DBHSBBD', // r10
      '#BSBBBDDBD....DBBBBD', // r11
      '#BBSDD.........DBBBD', // r12
      '#SB.............SBB#', // r13
      '#SH.............SSB#', // r14
      '#SH.............SSB#', // r15
      '....................', // r16
      '....................', // r17
      '....................', // r18
      '#SSS...........SDBS#', // r19
      '.#SS...........SSS#.', // r20
      '.#S#...........#SD#.', // r21
    ],
  },
  // 前かぶりキャップ（赤×白×水色のトラッカーキャップ＋髪色のサイドバーン 'B'/'D'）
  cap_forward: {
    front: [
      '........###.........', // r01
      '.....#########......', // r02
      '....##CCCCCCWW#.....', // r03
      '...#CCCWWWWWCCC#....', // r04
      '..#CCCWRRRWWWCCC#...', // r05
      '..#CCWRRRRRWWWCC#...', // r06
      '.#CCC.RRRRRWWWWCC#..', // r07
      '.#CCCMMMMMMMMWCCC#..', // r08
      '.#CCMRRRRRRRRRMMC#..', // r09
      '.#MRRRVVVVVVVRRRM#..', // r10
      '.#DDDVV.....VVDDD#..', // r11
      '.#BB#.........#BB#..', // r12
      '..##...........##...', // r13
    ],
    palette: {
      '#': '#120C1C',
      W: '#DCE8F8',
      C: '#B5D3EE',
      R: '#CA424E',
      M: '#912D43',
      V: '#2E0408',
    },
  },
  // 後ろかぶりキャップ（ブルーキャップ＋アジャスター窓から覗く髪色 'B'/'D'）
  cap_backward: {
    front: [
      '........###.........', // r01
      '.....#########......', // r02
      '....#LLLPNPLLL#.....', // r03
      '...#PLLLPNPLLLP#....', // r04
      '..#PPLLLPNPLLLPP#...', // r05
      '.#NPPLLNNNPPLLPPN#..', // r06
      '.#NPPL#BBB#PLLPPN#..', // r07
      '.#NPPL#DDD#PLLPPN#..', // r08
      '.#NPPP#NNN#PPPPPN#..', // r09
      '.#NN###########NN#..', // r10
      '.#DD#.........#DD#..', // r11
      '.#BD...........DB#..', // r12
      '..#.............#...', // r13
    ],
    palette: {
      '#': '#0A0D26',
      L: '#7084CB',
      P: '#5E72B2',
      N: '#384A86',
    },
  },
};

/**
 * 胴体＆腕テンプレート（rows 20..29, 20文字幅）
 * 首・腕の肌ピクセルは 'B' (base), 'S' (shadow), 'D' (deep) で表現し、肌色パレットと合成して描画する
 */
const OUTFIT_TEMPLATES: Record<
  OutfitType,
  { rows: readonly string[]; palette: Record<string, string> }
> = {
  // 爽やかなネイビー×ホワイトのボーダーTシャツ
  stripe: {
    rows: [
      '....#NN#DDD#NN#.....', // r20
      '...#WWNNNNNNNWW#....', // r21
      '..#NndWWWWWWWndN#...', // r22
      '..#WWdNNNNNNNdWW#...', // r23
      '.##DduWWWWWWWudD#...', // r24
      '.#SB#dNNNNNNNd#BS#..', // r25
      '.#BS#uWWWWWWWw#SB#..', // r26
      '.#BB#dNNNNNNNd#BB#..', // r27
      '.#BD#uWWWWWWWulDB#..', // r28
      '.#SS###########SS#..', // r29
    ],
    palette: {
      '#': '#100818',
      N: '#58566D',
      n: '#656A80',
      d: '#282C47',
      W: '#F7F7FC',
      w: '#E1E6FC',
      u: '#C5C9E4',
      l: '#8C8B9D',
    },
  },
  // 鮮やかなレッドの無地クルーネックTシャツ
  plain: {
    rows: [
      '....#sR#DDD#Rs#.....', // r20
      '...#RRRRsssRRRR#....', // r21
      '..#sRRRRRRRRRRRs#...', // r22
      '.##RsdRRRRRRRdsR#...', // r23
      '.##sssRRRRRRRsss#...', // r24
      '.#SB#sRRRRRRRs#BS#..', // r25
      '.#BS#sRRRRRRRs#SB#..', // r26
      '.#BB#sRRRRRRRs#BB#..', // r27
      '.#BD#sssssssss#DB#..', // r28
      '.#SS###########SS#..', // r29
    ],
    palette: {
      '#': '#180614',
      R: '#DB424C',
      s: '#982A3E',
      d: '#7A1F26',
    },
  },
  // フード＆白ドローコード＆カンガルーポケット付きのブルーパーカー
  hoodie: {
    rows: [
      '..#nPPH#DDD#HPPn#...', // r20
      '...#nddPnnnPddn#....', // r21
      '..#PHPdPdPdPdPHP#...', // r22
      '..#PdPPWPPPWPdPd#...', // r23
      '.#nPdPPWPPPWPHPdn#..', // r24
      '.#PP#PPPPPPPPP#PP#..', // r25
      '#nPP#PPdddddPP#PPn#.', // r26
      '##nn#PdPPPPPdd#nn##.', // r27
      '#BSD#dPPPPPPPd#DSB#.', // r28
      '#SSS#ddddddddd#SSS#.', // r29
    ],
    palette: {
      '#': '#060A24',
      P: '#5684C8',
      H: '#6892D5',
      d: '#2F56A4',
      n: '#3B4E84',
      W: '#B8DEFF',
    },
  },
  // グリーンの羽織りジャケット＋チャコールインナーTシャツ
  jacket: {
    rows: [
      '...#nGG#DDD#GGn#....', // r20
      '...#GGGsIIIsGGG#....', // r21
      '..#nGGGsIIIsGGGn#...', // r22
      '..#GGnGsIIIsGnGG#...', // r23
      '..#Gs#GsIIIsG#sG#...', // r24
      '.##Gs#GsIIIsG#sG##..', // r25
      '.#sGG#GsIIIsG#GGs#..', // r26
      '.#nn##GsIIIsG##nn#..', // r27
      '.#BD#ssdddddss#DB#..', // r28
      '.#SS#nnnJJJnnn#SS#..', // r29
    ],
    palette: {
      '#': '#0C120E',
      G: '#80A45E',
      s: '#587548',
      n: '#2D422A',
      I: '#464252',
      d: '#08101E',
      J: '#6A84A8',
    },
  },
};

/**
 * 下半身（デニムジーンズ＋スニーカー＋足元の接地シャドウ）（rows 30..37, 20文字幅）
 */
const LOWER_BODY_ROWS: readonly string[] = [
  '..###dJJJJJJJd###...', // r30
  '....#sJJ###JJs#.....', // r31
  '....#sJJ#.#JJs#.....', // r32
  '....#sJJ#.#JJs#.....', // r33
  '....#dJJs.#sJJ#.....', // r34
  '...g#cCC#g#CCc#g....', // r35
  '..gg#WWc#g#cWW#gg...', // r36
  '.ggg####ggg####ggg..', // r37
];

const LOWER_BODY_PALETTE: Record<string, string> = {
  '#': '#0A0816',
  J: '#688EB8',
  s: '#56769C',
  d: '#4B5A7C',
  C: '#48445C',
  c: '#34324C',
  W: '#FAF8FF',
  g: '#9E9EA4',
};

/**
 * 漂流モード（両手＋立体的な楕円形の赤×白ストライプ浮き輪＆水面の波紋）（rows 25..35, 20文字幅）
 * 中央の透明領域（'.'）からは選択中の服装（胴体）がそのまま覗く構造
 */
const DRIFTING_LOWER_ROWS: readonly string[] = [
  '.#SB...........BS#..', // r25: 浮き輪の左右上部にちょこんと添える両手（'S','B'は肌色）
  '.###...........###..', // r26: 浮き輪の左右上縁アウトライン
  '#RRR##.......##RRR#.', // r27: 浮き輪の左右カーブ＋内穴への段差アウトライン（中央gx=6..12は服）
  '#RRRRW#######WRRRR#.', // r28: 浮き輪の手前内穴アウトライン＋赤白ストライプ
  '#HRRWWWWRHRWWWWRRH#.', // r29: 浮き輪のぷっくり前面（ハイライト）
  '#sRRWWWWsRsWWWWRRs#.', // r30: 浮き輪のぷっくり前面（ミドル）
  '.#ssRwwwdddwwwRss#..', // r31: 浮き輪の下部シェーディング
  '..###############...', // r32: 浮き輪の底アウトライン
  '.qWWoooOOOOOoooWWq..', // r33: 水面の白波＆しぶき
  '..oooOOOOOOOOOooo...', // r34: 水面の波紋
  '.....ooooooooo......', // r35: 波紋フェード
];

const DRIFTING_PALETTE: Record<string, string> = {
  '#': '#141020',
  H: '#FF7A7E',
  R: '#EF474B',
  s: '#C42B36',
  d: '#8E1D28',
  W: '#FFFFFF',
  w: '#DCE6F2',
  O: '#38BDF8',
  o: '#7DD3FC',
  q: '#E0F2FE',
};

/**
 * 20x38 ドット規格の Simple Human Avatars 1:1 ピクセルレンダラー
 */
export function AvatarPixelCanvas({
  config,
  mode = 'standing',
  size = 140,
}: AvatarPixelCanvasProps) {
  const { skinTone, hairStyle, hairColor, eyeType, outfit } = config;

  const rects = useMemo(() => {
    // 20x38 の2次元カラーグリッド（null は透明）
    const grid: (string | null)[][] = Array.from({ length: GRID_H }, () =>
      Array.from({ length: GRID_W }, () => null),
    );

    const setPx = (x: number, y: number, color: string | null) => {
      if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H && color) {
        grid[y][x] = color;
      }
    };

    const drawTemplate = (
      rows: readonly string[],
      startY: number,
      palette: Record<string, string>,
    ) => {
      rows.forEach((rowStr, idx) => {
        const gy = startY + idx;
        for (let gx = 0; gx < GRID_W; gx++) {
          const ch = rowStr[gx];
          if (!ch || ch === '.') continue;
          setPx(gx, gy, palette[ch] ?? null);
        }
      });
    };

    const skinPalette = buildSkinPalette(skinTone);
    const baseHairPalette = buildHairPalette(hairColor);
    const hairLayer = HAIR_TEMPLATES[hairStyle];
    const hairPalette = { ...baseHairPalette, ...hairLayer.palette };

    // 1. 後ろの髪（long / wavy の背面レイヤー）
    if (hairLayer.back) {
      drawTemplate(hairLayer.back, 1, hairPalette);
    }

    // 2. 素体（頭部・顔・耳・顎ライン rows 9..19）
    drawTemplate(HEAD_TEMPLATE, 9, skinPalette);

    // 3. 目・表情（gy=13..15, gx=6 と gx=12）＆ 口（gy=16, gx=8..10）
    const eyeDark = '#1E0804';
    const eyeSoft = shiftRgb(skinTone, -85, -90, -82);

    setPx(8, 16, skinPalette.M);
    setPx(9, 16, shiftRgb(skinPalette.M, -6, -6, -6));
    setPx(10, 16, skinPalette.M);

    if (eyeType === 'dots') {
      setPx(6, 13, '#2B0A02');
      setPx(6, 14, eyeDark);
      setPx(6, 15, eyeDark);

      setPx(12, 13, '#2B0A02');
      setPx(12, 14, eyeDark);
      setPx(12, 15, eyeDark);
    } else if (eyeType === 'smile') {
      setPx(5, 14, eyeSoft);
      setPx(6, 13, eyeDark);
      setPx(7, 14, eyeSoft);

      setPx(11, 14, eyeSoft);
      setPx(12, 13, eyeDark);
      setPx(13, 14, eyeSoft);

      setPx(7, 15, skinPalette.S);
      setPx(11, 15, skinPalette.S);
    } else if (eyeType === 'calm') {
      setPx(5, 13, eyeSoft);
      setPx(6, 13, eyeSoft);
      setPx(6, 14, eyeDark);
      setPx(6, 15, eyeDark);

      setPx(12, 13, eyeSoft);
      setPx(13, 13, eyeSoft);
      setPx(12, 14, eyeDark);
      setPx(12, 15, eyeDark);
    } else {
      setPx(5, 13, '#FFFFFF');
      setPx(6, 13, eyeDark);
      setPx(5, 14, eyeDark);
      setPx(6, 14, eyeDark);
      setPx(5, 15, eyeSoft);
      setPx(6, 15, eyeDark);

      setPx(12, 13, '#FFFFFF');
      setPx(13, 13, eyeDark);
      setPx(12, 14, eyeDark);
      setPx(13, 14, eyeDark);
      setPx(12, 15, eyeDark);
      setPx(13, 15, eyeSoft);
    }

    // 4. 服装（胴体・腕 rows 20..29、漂流時は浮き輪より上の rows 20..27）
    const outfitData = OUTFIT_TEMPLATES[outfit];
    const outfitRows = mode === 'drifting' ? outfitData.rows.slice(0, 8) : outfitData.rows;
    drawTemplate(outfitRows, 20, { ...skinPalette, ...outfitData.palette });

    // 5. 前の髪・帽子（前髪・サイド・肩にかかる毛先）
    drawTemplate(hairLayer.front, 1, hairPalette);

    // 6. 下半身（立ち姿 or 浮き輪で漂流姿）
    if (mode === 'standing') {
      drawTemplate(LOWER_BODY_ROWS, 30, LOWER_BODY_PALETTE);
    } else {
      drawTemplate(DRIFTING_LOWER_ROWS, 25, { ...skinPalette, ...DRIFTING_PALETTE });
    }

    // 連続する同色ピクセルを横方向に結合して SVG Rect 数を最適化
    const merged: { x: number; y: number; w: number; color: string }[] = [];
    for (let y = 0; y < GRID_H; y++) {
      let x = 0;
      while (x < GRID_W) {
        const color = grid[y][x];
        if (!color) {
          x++;
          continue;
        }
        let w = 1;
        while (x + w < GRID_W && grid[y][x + w] === color) {
          w++;
        }
        merged.push({ x, y, w, color });
        x += w;
      }
    }
    return merged;
  }, [skinTone, hairStyle, hairColor, eyeType, outfit, mode]);

  const svgHeight = Math.round((size * GRID_H) / GRID_W);

  return (
    <Svg
      width={size}
      height={svgHeight}
      viewBox={`0 0 ${GRID_W} ${GRID_H}`}
      accessibilityRole="image"
      accessibilityLabel={mode === 'drifting' ? '浮き輪で漂流中のアバター' : '立ち姿のアバター'}
    >
      {rects.map((r) => (
        <Rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
      ))}
    </Svg>
  );
}
