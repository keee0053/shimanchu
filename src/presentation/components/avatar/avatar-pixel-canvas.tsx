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

interface ColorRamp {
  outline: string;
  deep: string;
  shadow: string;
  base: string;
  highlight: string;
}

interface SkinRamp {
  outline: string;
  canal: string;
  chinCorner: string;
  deep: string;
  shadow: string;
  base: string;
  highlight: string;
  mouth: string;
}

const GRID_W = 20;
const GRID_H = 38;

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
}

function toHex(r: number, g: number, b: number): string {
  return `#${clampByte(r).toString(16).padStart(2, '0')}${clampByte(g).toString(16).padStart(2, '0')}${clampByte(b).toString(16).padStart(2, '0')}`;
}

function shiftRgb(hex: string, dr: number, dg: number, db: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex(r + dr, g + dg, b + db);
}

function scaleRgb(hex: string, factor: number, add = 0): string {
  const [r, g, b] = parseHex(hex);
  return toHex(r * factor + add, g * factor + add, b * factor + add);
}

/**
 * Simple Human Avatars の肌色グラデーションパレットを生成
 */
function buildSkinRamp(skinTone: string): SkinRamp {
  return {
    outline: '#16070A',
    canal: shiftRgb(skinTone, -110, -118, -108),
    chinCorner: shiftRgb(skinTone, -98, -94, -85),
    deep: shiftRgb(skinTone, -42, -52, -46),
    shadow: shiftRgb(skinTone, -16, -24, -22),
    base: skinTone,
    highlight: shiftRgb(skinTone, 10, 12, 12),
    mouth: shiftRgb(skinTone, -68, -82, -74),
  };
}

/**
 * Simple Human Avatars の5段階ヘアシェーディングパレットを生成
 */
function buildHairRamp(hairColor: string): ColorRamp {
  return {
    outline: scaleRgb(hairColor, 0.22, 4),
    deep: scaleRgb(hairColor, 0.52, 4),
    shadow: scaleRgb(hairColor, 0.78, 2),
    base: hairColor,
    highlight: shiftRgb(hairColor, 26, 24, 28),
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
 * 髪型テンプレート（20文字幅、r01から開始）
 * '.' = 透明, '#' = アウトライン, 'D' = 深い影(前髪下/生え際), 'S' = 影, 'B' = ベース, 'H' = ハイライト
 */
const HAIR_TEMPLATES: Record<
  Exclude<HairStyle, 'cap_forward' | 'cap_backward'>,
  readonly string[]
> = {
  // マッシュ（画像9番目ベース：丸みのあるシルエット＋自然な前髪グラデーション）
  mush: [
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
  // ショート（画像2番目ベース：動きのある無造作ショート＋アシンメトリーな前髪）
  short: [
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
  // センター分け（画像11番目ベース：額が覗く上品なパートヘア）
  center_part: [
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
  // ロング（画像5番目ベース：肩まで降りるストレートロング）
  long: [
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
    '#BBD...........DBB#.', // r13
    '#BBD...........DBB#.', // r14
    '#BBD...........DBB#.', // r15
    '#BBD...........#BB#.', // r16
    '#BBD...........#BB#.', // r17
    '#BBS...........DBB#.', // r18
    '#BBD...........DBB#.', // r19
    '#SSD...........DSH#.', // r20
    '#SB#...........#BS#.', // r21
  ],
  // ウェーブ（画像12番目ベース：ふんわりボリュームのセミロングウェーブ）
  wavy: [
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
    '#SBS...........DSBB#', // r13
    '#SHD...........DSSB#', // r14
    '#SHD...........DSSB#', // r15
    '#SBD...........SDSB#', // r16
    '#SS#...........#SSS#', // r17
    '#SSD...........SDSS#', // r18
    '#SSS...........SDBS#', // r19
    '.#SS...........SSS#.', // r20
    '.#S#...........#SD#.', // r21
  ],
};

/**
 * 前かぶりキャップ（画像1番目ベース：赤×白×水色のトラッカーキャップ＋髪色のサイドバーン）
 * '#' = 輪郭, 'W' = 白パネル, 'C' = アイスブルー陰影, 'R' = 赤ロゴ/バイザー, 'M' = 濃赤バイザー影,
 * 'V' = バイザー下暗影, 'H' = 髪ベース, 'D' = 髪影
 */
const CAP_FORWARD_TEMPLATE: readonly string[] = [
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
  '.#HH#.........#HH#..', // r12
  '..##...........##...', // r13
];

/**
 * 後ろかぶりキャップ（画像3番目ベース：ブルーキャップ＋アジャスター窓から覗く髪色）
 * '#' = 輪郭, 'B' = ブルーベース, 'L' = ブルーハイライト, 'N' = ネイビー影,
 * 'H' = 髪ベース, 'D' = 髪影
 */
const CAP_BACKWARD_TEMPLATE: readonly string[] = [
  '........###.........', // r01
  '.....#########......', // r02
  '....#LLLBNBLLL#.....', // r03
  '...#BLLLBNBLLLB#....', // r04
  '..#BBLLLBNBLLLBB#...', // r05
  '.#NBBLLNNNBBLLBBN#..', // r06
  '.#NBBL#HHH#BLLBBN#..', // r07
  '.#NBBL#DDD#BLLBBN#..', // r08
  '.#NBBB#NNN#BBBBBN#..', // r09
  '.#NN###########NN#..', // r10
  '.#DD#.........#DD#..', // r11
  '.#HD...........DH#..', // r12
  '..#.............#...', // r13
];

/**
 * 胴体＆腕テンプレート（rows 20..29, 20文字幅）
 * 腕の肌ピクセルは 'B' (base), 'S' (shadow), 'D' (deep), '#' (outline) で表現し、選択した肌色に連動する
 */
const OUTFIT_TEMPLATES: Record<
  OutfitType,
  { rows: readonly string[]; palette: Record<string, string> }
> = {
  // 画像2番目：爽やかなネイビー×ホワイトのボーダーTシャツ
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
  // 画像9番目：鮮やかなレッドの無地クルーネックTシャツ
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
  // 画像1番目：フード＆白ドローコード＆カンガルーポケット付きのブルーパーカー
  hoodie: {
    rows: [
      '..#nBBH#DDD#HBBn#...', // r20
      '...#nddBnnnBddn#....', // r21
      '..#BHBdBdBdBdBHB#...', // r22
      '..#BdBBWBBBWBHBd#...', // r23
      '.#nBdBBWBBBWBHBdn#..', // r24
      '.#BB#BBBBBBBBB#BB#..', // r25
      '#nBB#BBdddddBB#BBn#.', // r26
      '##nn#BdBBBBBdd#nn##.', // r27
      '#BSD#dBBBBBBBd#DSB#.', // r28
      '#SSS#ddddddddd#SSS#.', // r29
    ],
    palette: {
      '#': '#060A24',
      B: '#5684C8',
      H: '#6892D5',
      d: '#2F56A4',
      n: '#3B4E84',
      W: '#B8DEFF',
    },
  },
  // 画像6番目：グリーンの羽織りジャケット＋チャコールインナーTシャツ
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
 * 漂流モード（立体的な楕円形の赤×白ストライプ浮き輪＆水面の波紋）（rows 26..35, 20文字幅）
 * 中央の透明領域（'.'）からは選択中の服装（胴体）がそのまま覗く構造
 */
const DRIFTING_LOWER_ROWS: readonly string[] = [
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

    const skin = buildSkinRamp(skinTone);
    const hair = buildHairRamp(hairColor);

    // ==========================================
    // 1. 背面ロングヘア（long / wavy の肩より下の部分）
    // ==========================================
    if (hairStyle === 'long' || hairStyle === 'wavy') {
      const template = HAIR_TEMPLATES[hairStyle];
      template.forEach((rowStr, idx) => {
        const gy = idx + 1;
        for (let gx = 0; gx < GRID_W; gx++) {
          const ch = rowStr[gx];
          if (!ch || ch === '.') continue;
          const color =
            ch === '#'
              ? hair.outline
              : ch === 'D'
                ? hair.deep
                : ch === 'S'
                  ? hair.shadow
                  : ch === 'H'
                    ? hair.highlight
                    : hair.base;
          setPx(gx, gy, color);
        }
      });
    }

    // ==========================================
    // 2. 素体（頭部・顔・耳・顎ライン rows 9..19）
    // ==========================================
    HEAD_TEMPLATE.forEach((rowStr, idx) => {
      const gy = idx + 9;
      for (let gx = 0; gx < GRID_W; gx++) {
        const ch = rowStr[gx];
        if (!ch || ch === '.') continue;
        // long / wavy の場合は耳（gx=0..1, 17..18）が髪に隠れるためスキップ
        if (
          (hairStyle === 'long' || hairStyle === 'wavy') &&
          (gx <= 2 || gx >= 16) &&
          gy >= 13 &&
          gy <= 15
        ) {
          continue;
        }
        const color =
          ch === '#'
            ? skin.outline
            : ch === 'C'
              ? skin.canal
              : ch === 'K'
                ? skin.chinCorner
                : ch === 'D'
                  ? skin.deep
                  : ch === 'S'
                    ? skin.shadow
                    : ch === 'H'
                      ? skin.highlight
                      : skin.base;
        setPx(gx, gy, color);
      }
    });

    // ==========================================
    // 3. 目・表情（gy=13..15, gx=6 と gx=12）＆ 口（gy=16, gx=8..10）
    // ==========================================
    const eyeDark = '#1E0804';
    const eyeSoft = shiftRgb(skinTone, -85, -90, -82);

    // 口（添付画像全12キャラ共通：目の1ドット下、中央3ドット gx=8..10, gy=16）
    setPx(8, 16, skin.mouth);
    setPx(9, 16, shiftRgb(skin.mouth, -6, -6, -6));
    setPx(10, 16, skin.mouth);

    if (eyeType === 'dots') {
      // 添付画像のオリジナル点目（1x3 縦ドット：上端ほんのりハイライト＋濃い黒茶）
      setPx(6, 13, '#2B0A02');
      setPx(6, 14, eyeDark);
      setPx(6, 15, eyeDark);

      setPx(12, 13, '#2B0A02');
      setPx(12, 14, eyeDark);
      setPx(12, 15, eyeDark);
    } else if (eyeType === 'smile') {
      // にっこり笑顔（やわらかいアーチ目）
      setPx(5, 14, eyeSoft);
      setPx(6, 13, eyeDark);
      setPx(7, 14, eyeSoft);

      setPx(11, 14, eyeSoft);
      setPx(12, 13, eyeDark);
      setPx(13, 14, eyeSoft);
      // 口角も少し明るくにっこり
      setPx(7, 15, skin.shadow);
      setPx(11, 15, skin.shadow);
    } else if (eyeType === 'calm') {
      // クールなジト目（半目＋落ち着いたまぶた）
      setPx(5, 13, eyeSoft);
      setPx(6, 13, eyeSoft);
      setPx(6, 14, eyeDark);
      setPx(6, 15, eyeDark);

      setPx(12, 13, eyeSoft);
      setPx(13, 13, eyeSoft);
      setPx(12, 14, eyeDark);
      setPx(12, 15, eyeDark);
    } else {
      // パッチリ丸目（キャッチライト入り）
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

    // ==========================================
    // 4. 髪型・帽子（前面レイヤー）
    // ==========================================
    if (hairStyle === 'cap_forward') {
      CAP_FORWARD_TEMPLATE.forEach((rowStr, idx) => {
        const gy = idx + 1;
        for (let gx = 0; gx < GRID_W; gx++) {
          const ch = rowStr[gx];
          if (!ch || ch === '.') continue;
          const color =
            ch === '#'
              ? '#120C1C'
              : ch === 'W'
                ? '#DCE8F8'
                : ch === 'C'
                  ? '#B5D3EE'
                  : ch === 'R'
                    ? '#CA424E'
                    : ch === 'M'
                      ? '#912D43'
                      : ch === 'V'
                        ? '#2E0408'
                        : ch === 'H'
                          ? hair.base
                          : hair.deep;
          setPx(gx, gy, color);
        }
      });
    } else if (hairStyle === 'cap_backward') {
      CAP_BACKWARD_TEMPLATE.forEach((rowStr, idx) => {
        const gy = idx + 1;
        for (let gx = 0; gx < GRID_W; gx++) {
          const ch = rowStr[gx];
          if (!ch || ch === '.') continue;
          const color =
            ch === '#'
              ? '#0A0D26'
              : ch === 'L'
                ? '#7084CB'
                : ch === 'B'
                  ? '#5E72B2'
                  : ch === 'N'
                    ? '#384A86'
                    : ch === 'H'
                      ? hair.base
                      : hair.deep;
          setPx(gx, gy, color);
        }
      });
    } else {
      const template = HAIR_TEMPLATES[hairStyle];
      template.forEach((rowStr, idx) => {
        const gy = idx + 1;
        // long / wavy の gy >= 13 は背面レイヤーで描画済み（前髪・頭頂部 gy <= 12 は前面に上書き）
        if ((hairStyle === 'long' || hairStyle === 'wavy') && gy >= 13) {
          return;
        }
        for (let gx = 0; gx < GRID_W; gx++) {
          const ch = rowStr[gx];
          if (!ch || ch === '.') continue;
          const color =
            ch === '#'
              ? hair.outline
              : ch === 'D'
                ? hair.deep
                : ch === 'S'
                  ? hair.shadow
                  : ch === 'H'
                    ? hair.highlight
                    : hair.base;
          setPx(gx, gy, color);
        }
      });
    }

    // ==========================================
    // 5. 服装（胴体・腕 rows 20..29）
    // ==========================================
    const outfitData = OUTFIT_TEMPLATES[outfit];
    const maxOutfitRow = mode === 'drifting' ? 27 : 29;
    outfitData.rows.forEach((rowStr, idx) => {
      const gy = idx + 20;
      if (gy > maxOutfitRow) return;
      for (let gx = 0; gx < GRID_W; gx++) {
        const ch = rowStr[gx];
        if (!ch || ch === '.') continue;
        // 首元・腕の肌色トークン（ただし hoodie の 'B' はパーカーの青なので腕領域のみ肌色にする）
        const isArmOrNeckSkin =
          (gy === 20 && gx >= 7 && gx <= 11 && ch === 'D') ||
          (outfit !== 'hoodie' && (ch === 'B' || ch === 'S' || ch === 'D')) ||
          (outfit === 'hoodie' &&
            gy >= 28 &&
            (gx <= 3 || gx >= 15) &&
            (ch === 'B' || ch === 'S' || ch === 'D'));

        if (isArmOrNeckSkin) {
          const skinCol = ch === 'D' ? skin.deep : ch === 'S' ? skin.shadow : skin.base;
          setPx(gx, gy, skinCol);
        } else {
          const col = outfitData.palette[ch];
          if (col) setPx(gx, gy, col);
        }
      }
    });

    // long / wavy の毛先（rows 19..21 の左右端）を肩の上に重ねて自然になじませる
    if (hairStyle === 'long' || hairStyle === 'wavy') {
      const template = HAIR_TEMPLATES[hairStyle];
      for (let gy = 19; gy <= 21; gy++) {
        const rowStr = template[gy - 1];
        if (!rowStr) continue;
        for (const gx of [0, 1, 2, 3, 15, 16, 17, 18, 19]) {
          const ch = rowStr[gx];
          if (!ch || ch === '.') continue;
          const color =
            ch === '#'
              ? hair.outline
              : ch === 'D'
                ? hair.deep
                : ch === 'S'
                  ? hair.shadow
                  : ch === 'H'
                    ? hair.highlight
                    : hair.base;
          setPx(gx, gy, color);
        }
      }
    }

    // ==========================================
    // 6. 下半身（立ち姿 or 浮き輪で漂流姿）
    // ==========================================
    if (mode === 'standing') {
      LOWER_BODY_ROWS.forEach((rowStr, idx) => {
        const gy = idx + 30;
        for (let gx = 0; gx < GRID_W; gx++) {
          const ch = rowStr[gx];
          if (!ch || ch === '.') continue;
          setPx(gx, gy, LOWER_BODY_PALETTE[ch] ?? null);
        }
      });
    } else {
      // 浮き輪の左右上部にちょこんと添える両手（全服装共通で肌色を反映）
      setPx(1, 25, '#141020');
      setPx(2, 25, skin.shadow);
      setPx(3, 25, skin.base);
      setPx(15, 25, skin.base);
      setPx(16, 25, skin.shadow);
      setPx(17, 25, '#141020');

      DRIFTING_LOWER_ROWS.forEach((rowStr, idx) => {
        const gy = idx + 26;
        for (let gx = 0; gx < GRID_W; gx++) {
          const ch = rowStr[gx];
          if (!ch || ch === '.') continue;
          setPx(gx, gy, DRIFTING_PALETTE[ch] ?? null);
        }
      });
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
    <Svg width={size} height={svgHeight} viewBox={`0 0 ${GRID_W} ${GRID_H}`}>
      {rects.map((r, i) => (
        <Rect key={`${r.x}-${r.y}-${i}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
      ))}
    </Svg>
  );
}
