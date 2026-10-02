import { describe, it, expect } from 'vitest';
import { parseRupees, formatINR, parsePercent, groupIndian } from './money';

describe('money domain logic', () => {
  describe('parseRupees', () => {
    it.each([
      ['1250.50', { ok: true, paise: 125050 }],
      ['12', { ok: true, paise: 1200 }],
      ['12.5', { ok: true, paise: 1250 }],
      ['0.05', { ok: true, paise: 5 }],
      [' 7 ', { ok: true, paise: 700 }],
      ['', { ok: false, reason: 'empty' }],
      ['   ', { ok: false, reason: 'empty' }],
      ['abc', { ok: false, reason: 'invalid' }],
      ['12abc', { ok: false, reason: 'invalid' }],
      ['-5', { ok: false, reason: 'negative' }],
      ['- 5.25', { ok: false, reason: 'negative' }],
      ['1.234', { ok: false, reason: 'too-many-decimals' }],
    ])('parses "%s" to %o', (input, expected) => {
      expect(parseRupees(input)).toEqual(expected);
    });
  });

  describe('groupIndian', () => {
    it.each([
      ['0', '0'],
      ['999', '999'],
      ['1250', '1,250'],
      ['100000', '1,00,000'],
      ['1000000', '10,00,000'],
    ])('groups digits "%s" to "%s"', (digits, expected) => {
      expect(groupIndian(digits)).toBe(expected);
    });
  });

  describe('formatINR', () => {
    it.each([
      [0, '₹0.00'],
      [5, '₹0.05'],
      [125050, '₹1,250.50'],
      [99999, '₹999.99'],
      [10000000, '₹1,00,000.00'],
      [100000000, '₹10,00,000.00'],
      [-125050, '-₹1,250.50'],
    ])('formats %d paise to %s', (paise, expected) => {
      expect(formatINR(paise)).toBe(expected);
    });
  });

  describe('parsePercent', () => {
    it.each([
      ['33.33', { ok: true, basisPoints: 3333 }],
      ['100', { ok: true, basisPoints: 10000 }],
      ['0', { ok: true, basisPoints: 0 }],
      ['50.5', { ok: true, basisPoints: 5050 }],
      ['100.01', { ok: false, reason: 'out-of-range' }],
      ['-1', { ok: false, reason: 'negative' }],
      ['12.345', { ok: false, reason: 'too-many-decimals' }],
      ['', { ok: false, reason: 'empty' }],
      ['foo', { ok: false, reason: 'invalid' }],
    ])('parses "%s" to %o', (input, expected) => {
      expect(parsePercent(input)).toEqual(expected);
    });
  });
});
