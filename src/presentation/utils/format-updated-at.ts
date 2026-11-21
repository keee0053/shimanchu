function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * ISO 8601 日時文字列を日付付きの表示形式に整形する
 */
export function formatUpdatedAt(isoString: string | null, now: Date = new Date()): string {
  if (!isoString) {
    return '未判定';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '未判定';
  }

  const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  if (date.getFullYear() !== now.getFullYear()) {
    return `${date.getFullYear()}/${monthDay} ${time}`;
  }
  return `${monthDay} ${time}`;
}
