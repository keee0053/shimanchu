import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { type DateParts, getJstToday } from '@/domain/services/registration-birth-date';

const CHECK_INTERVAL_MS = 60 * 1000;

function isSameDate(a: DateParts, b: DateParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/**
 * 日本時間の今日。画面を開いたまま日付が変わったときや、アプリに戻ってきたときに更新する
 * refresh はその場で取り直した今日を返す（ピッカーを開くときなど、定期更新を待てない場面で使う）
 */
export function useJstToday(): { today: DateParts; refresh: () => DateParts } {
  const [today, setToday] = useState(() => getJstToday(new Date()));

  const refresh = useCallback(() => {
    const next = getJstToday(new Date());
    setToday((current) => (isSameDate(current, next) ? current : next));
    return next;
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, CHECK_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refresh]);

  return { today, refresh };
}
