/**
 * Tests for dashboard calculation utilities
 */

import {
  calculateChangePercentage,
  normalizeDashboardData,
  calculateDashboardChanges,
  getDefaultDashboardData
} from './dashboardCalculations';

describe('calculateChangePercentage', () => {
  it('should calculate positive percentage change correctly', () => {
    const result = calculateChangePercentage(150, 100);
    expect(result).toBe(50);
  });

  it('should calculate negative percentage change correctly', () => {
    const result = calculateChangePercentage(75, 100);
    expect(result).toBe(-25);
  });

  it('should handle zero previous value by returning 100% if current > 0', () => {
    const result = calculateChangePercentage(100, 0);
    expect(result).toBe(100);
  });

  it('should handle zero previous value by returning 0% if current = 0', () => {
    const result = calculateChangePercentage(0, 0);
    expect(result).toBe(0);
  });

  it('should handle string numbers correctly', () => {
    const result = calculateChangePercentage('150' as any, '100' as any);
    expect(result).toBe(50);
  });

  it('should handle null/undefined values safely', () => {
    const result = calculateChangePercentage(null as any, undefined as any);
    expect(result).toBe(0);
  });
});

describe('normalizeDashboardData', () => {
  it('should normalize valid data correctly', () => {
    const rawData = {
      spent_today: '100',
      spent_yesterday: '75',
      spent_this_week: '500',
      spent_last_week: '400',
      spent_this_month: '2000',
      spent_last_month: '1500',
    };

    const result = normalizeDashboardData(rawData);

    expect(result).toEqual({
      spent_today: 100,
      spent_yesterday: 75,
      spent_this_week: 500,
      spent_last_week: 400,
      spent_this_month: 2000,
      spent_last_month: 1500,
    });
  });

  it('should handle null data by returning defaults', () => {
    const result = normalizeDashboardData(null);

    expect(result).toEqual({
      spent_today: 0,
      spent_yesterday: 0,
      spent_this_week: 0,
      spent_last_week: 0,
      spent_this_month: 0,
      spent_last_month: 0,
    });
  });

  it('should handle invalid numbers by converting to 0', () => {
    const rawData = {
      spent_today: 'invalid',
      spent_yesterday: null,
      spent_this_week: undefined,
      spent_last_week: NaN,
      spent_this_month: '',
      spent_last_month: '150',
    };

    const result = normalizeDashboardData(rawData);

    expect(result).toEqual({
      spent_today: 0,
      spent_yesterday: 0,
      spent_this_week: 0,
      spent_last_week: 0,
      spent_this_month: 0,
      spent_last_month: 150,
    });
  });
});

describe('calculateDashboardChanges', () => {
  it('should calculate all percentage changes correctly', () => {
    const data = {
      spent_today: 100,
      spent_yesterday: 75,
      spent_this_week: 500,
      spent_last_week: 400,
      spent_this_month: 2000,
      spent_last_month: 1500,
    };

    const result = calculateDashboardChanges(data);

    expect(result).toEqual({
      todayChange: 33.333333333333336, // (100-75)/75*100
      weekChange: 25,                  // (500-400)/400*100
      monthChange: 33.333333333333336, // (2000-1500)/1500*100
    });
  });

  it('should handle zero values correctly', () => {
    const data = {
      spent_today: 100,
      spent_yesterday: 0,
      spent_this_week: 0,
      spent_last_week: 0,
      spent_this_month: 0,
      spent_last_month: 200,
    };

    const result = calculateDashboardChanges(data);

    expect(result).toEqual({
      todayChange: 100,  // Previous was 0, current > 0
      weekChange: 0,     // Both current and previous are 0
      monthChange: -100, // (0-200)/200*100
    });
  });
});

describe('getDefaultDashboardData', () => {
  it('should return default data structure with zeros', () => {
    const result = getDefaultDashboardData();

    expect(result).toEqual({
      spent_today: 0,
      spent_yesterday: 0,
      spent_this_week: 0,
      spent_last_week: 0,
      spent_this_month: 0,
      spent_last_month: 0,
    });
  });
});