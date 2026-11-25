import type { IslandType, PlaceIslandType, PlaceRadius } from '@/domain/entities/island';

/**
 * 島の表示情報（画面表示用）
 */
export const ISLAND_LABELS: Record<IslandType, { label: string; description: string }> = {
  home: {
    label: '家の島',
    description: '登録した家の範囲内にいます',
  },
  school: {
    label: '学校の島',
    description: '登録した学校の範囲内にいます',
  },
  outside: {
    label: '外出中の島',
    description: '現在地を取得できましたが、家・学校の範囲外です',
  },
  drifting: {
    label: '漂流中（海）',
    description: '位置情報を取得できない、または権限がありません',
  },
};

/**
 * 登録できる場所の表示情報
 */
export const PLACE_ISLAND_LABELS: Record<
  PlaceIslandType,
  { label: string; accentColor: string; fillColor: string }
> = {
  home: {
    label: '家',
    accentColor: '#16A34A',
    fillColor: 'rgba(22, 163, 74, 0.18)',
  },
  school: {
    label: '学校',
    accentColor: '#0284C7',
    fillColor: 'rgba(2, 132, 199, 0.18)',
  },
};

/**
 * 判定半径の選択肢の表示情報
 */
export const PLACE_RADIUS_LABELS: Record<PlaceRadius, { label: string }> = {
  100: { label: '小（100m）' },
  200: { label: '中（200m）' },
  500: { label: '大（500m）' },
};
