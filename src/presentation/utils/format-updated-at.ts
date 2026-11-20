/**
 * ISO 8601 日時文字列を時:分:秒の表示形式に整形する
 */
export function formatUpdatedAt(isoString: string | null): string {
  if (!isoString) {
    return '未判定';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '未判定';
  }
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
