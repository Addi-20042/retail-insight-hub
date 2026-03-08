/**
 * Centralized locale formatting utilities.
 * All currency / number formatting goes through here to keep locale consistent.
 */

const LOCALE = 'en-IN';
const CURRENCY = '₹';

/** Format a number as Indian-locale currency string, e.g. ₹1,23,456 */
export const formatCurrency = (value: number, compact = false): string => {
  if (compact) {
    if (value >= 1_00_000) return `${CURRENCY}${(value / 1_00_000).toFixed(1)}L`;
    if (value >= 1_000) return `${CURRENCY}${(value / 1_000).toFixed(1)}k`;
  }
  return `${CURRENCY}${Math.round(value).toLocaleString(LOCALE)}`;
};

/** Format a number with Indian-locale grouping, e.g. 1,23,456 */
export const formatNumber = (value: number): string =>
  value.toLocaleString(LOCALE);

/** Format a date to dd/mm/yyyy */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string =>
  new Date(date).toLocaleDateString(LOCALE, options ?? { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Format a compact axis tick, e.g. ₹12k */
export const formatAxisTick = (value: number): string =>
  `${CURRENCY}${(value / 1000).toFixed(0)}k`;
