import { describe, it, expect } from 'vitest';

// Import utility functions that would typically be found in a utils file
// These are helper functions used in the Loyalty Journey page

// Currency formatter
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Date formatter
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Month formatter
function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
}

describe('Format Utilities', () => {
  describe('formatCurrency', () => {
    it('should format a positive number as USD currency', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(99.99)).toBe('$99.99');
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });

    it('should format a negative number as USD currency', () => {
      expect(formatCurrency(-50.5)).toBe('-$50.50');
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('should format zero as USD currency', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should round values to 2 decimal places', () => {
      expect(formatCurrency(99.999)).toBe('$100.00');
      expect(formatCurrency(99.991)).toBe('$99.99');
      expect(formatCurrency(0.001)).toBe('$0.00');
    });
  });

  describe('formatDate', () => {
    it('should format ISO date strings correctly', () => {
      expect(formatDate('2025-01-15T00:00:00.000Z')).toBe('Jan 15, 2025');
      expect(formatDate('2025-12-31T23:59:59.999Z')).toBe('Dec 31, 2025');
    });

    it('should handle different date formats', () => {
      expect(formatDate('2025/02/20')).toBe('Feb 20, 2025');
      expect(formatDate('2025-03-10')).toBe('Mar 10, 2025');
    });
  });

  describe('formatMonth', () => {
    it('should format YYYY-MM strings to month and year', () => {
      expect(formatMonth('2025-01')).toBe('Jan 2025');
      expect(formatMonth('2025-12')).toBe('Dec 2025');
    });

    it('should handle single-digit months', () => {
      expect(formatMonth('2025-1')).toBe('Jan 2025');
      expect(formatMonth('2025-9')).toBe('Sep 2025');
    });

    it('should handle leading zeros in months', () => {
      expect(formatMonth('2025-01')).toBe('Jan 2025');
      expect(formatMonth('2025-09')).toBe('Sep 2025');
    });
  });
});