import {
  format,
  formatDistanceStrict,
  isValid,
  isWithinInterval,
  subMonths,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

type DateTimeValue = Date | number | string | null | undefined;

const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm';
const FULL_DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
const JUST_NOW = '刚刚';

/** 「刚刚更新」/「更新于 3 分钟前」，用于数据面板的最近刷新时间。 */
export function formatUpdatedAt(value: DateTimeValue, now = new Date()) {
  const text = formatDisplayDateTime(value, '', now);
  if (!text) {
    return '';
  }
  return text === JUST_NOW ? '刚刚更新' : `更新于 ${text}`;
}

/** 一分钟内显示「刚刚」，一个月内显示相对时间，超出一个月显示完整日期和分钟。 */
export function formatDisplayDateTime(
  value: DateTimeValue,
  fallback = '-',
  now = new Date(),
) {
  const date = parseDateTime(value);
  if (!date) {
    return fallback;
  }

  // Sub-minute (incl. small clock skew) reads better as 刚刚 than "0 秒前".
  if (Math.abs(now.getTime() - date.getTime()) < 60_000) {
    return JUST_NOW;
  }

  if (
    isWithinInterval(date, {
      start: subMonths(now, 1),
      end: now,
    })
  ) {
    return formatDistanceStrict(date, now, {
      addSuffix: true,
      roundingMethod: 'floor',
      locale: zhCN,
    });
  }

  return format(date, DATE_TIME_FORMAT, { locale: zhCN });
}

export function formatDateTimeTitle(value: DateTimeValue) {
  const date = parseDateTime(value);
  return date
    ? format(date, FULL_DATE_TIME_FORMAT, { locale: zhCN })
    : undefined;
}

function parseDateTime(value: DateTimeValue) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return isValid(date) ? date : null;
}
