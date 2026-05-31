import { Language } from '../types';

const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export const toArabicDigits = (num: string | number): string => {
  return String(num).replace(/[0-9]/g, (d) => arabicDigits[parseInt(d)]);
};

export const formatNumber = (num: number, lang: Language, decimals = 0): string => {
  const formatted = num.toFixed(decimals);
  return lang === 'ar' ? toArabicDigits(formatted) : formatted;
};

export const formatPrice = (num: number, lang: Language, currency: string, decimals = 2): string => {
  const formatted = formatNumber(num, lang, decimals);
  return `${formatted} ${currency}`;
};

export const formatPercent = (num: number, lang: Language): string => {
  const formatted = formatNumber(num, lang, 0);
  return `${formatted}%`;
};

/**
 * Format a number with Arabic digits when lang is 'ar'.
 * Simple wrapper for displaying any numeric value.
 */
export const fn = (num: number | string, lang: Language): string => {
  return lang === 'ar' ? toArabicDigits(String(num)) : String(num);
};

/**
 * Format a monetary value - negative values get special treatment
 */
export const formatMoney = (num: number, lang: Language, currency: string, decimals = 0): string => {
  const abs = Math.abs(num);
  const formatted = formatNumber(abs, lang, decimals);
  const sign = num < 0 ? '-' : '';
  return `${sign}${formatted} ${currency}`;
};

/**
 * Check if a value is negative (for styling purposes)
 */
export const isNegative = (num: number): boolean => num < 0;
