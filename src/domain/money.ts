import type { Paise } from './types';

export const MAX_AMOUNT_PAISE: Paise = 100_000_000; // ₹10,00,000

export type MoneyParse =
  | { ok: true; paise: Paise }
  | { ok: false; reason: 'empty' | 'invalid' | 'too-many-decimals' | 'negative' };

export function parseRupees(input: string): MoneyParse {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, reason: 'empty' };
  }

  if (/^-\s*\d*\.?\d+$/.test(trimmed)) {
    return { ok: false, reason: 'negative' };
  }

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, reason: 'invalid' };
  }

  const parts = trimmed.split('.');
  const intPart = parts[0] ?? '0';
  const decPart = parts[1];

  if (decPart !== undefined && decPart.length > 2) {
    return { ok: false, reason: 'too-many-decimals' };
  }

  const normalizedDec = (decPart ?? '').padEnd(2, '0');
  const paise = Number(intPart) * 100 + Number(normalizedDec);

  return { ok: true, paise };
}

export type PercentParse =
  | { ok: true; basisPoints: number }
  | { ok: false; reason: 'empty' | 'invalid' | 'out-of-range' | 'too-many-decimals' | 'negative' };

export function parsePercent(input: string): PercentParse {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, reason: 'empty' };
  }

  if (/^-\s*\d*\.?\d+$/.test(trimmed)) {
    return { ok: false, reason: 'negative' };
  }

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, reason: 'invalid' };
  }

  const parts = trimmed.split('.');
  const intPart = parts[0] ?? '0';
  const decPart = parts[1];

  if (decPart !== undefined && decPart.length > 2) {
    return { ok: false, reason: 'too-many-decimals' };
  }

  const normalizedDec = (decPart ?? '').padEnd(2, '0');
  const basisPoints = Number(intPart) * 100 + Number(normalizedDec);

  if (basisPoints < 0 || basisPoints > 10000) {
    return { ok: false, reason: 'out-of-range' };
  }

  return { ok: true, basisPoints };
}

export function percentToBasisPoints(p: number): number {
  return Math.round(p * 100);
}

export function groupIndian(digits: string): string {
  if (digits.length <= 3) {
    return digits;
  }
  const lastThree = digits.slice(-3);
  const remaining = digits.slice(0, -3);
  const groups: string[] = [];
  let i = remaining.length;
  while (i > 0) {
    const start = Math.max(0, i - 2);
    groups.unshift(remaining.slice(start, i));
    i -= 2;
  }
  return `${groups.join(',')},${lastThree}`;
}

export function formatINR(paise: Paise): string {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  const rupees = Math.trunc(abs / 100);
  const paisa = abs % 100;
  const paisaStr = String(paisa).padStart(2, '0');
  const groupedRupees = groupIndian(String(rupees));
  return `${sign}₹${groupedRupees}.${paisaStr}`;
}
