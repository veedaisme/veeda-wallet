import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DashboardView } from './DashboardView';
// Import the mocked hook itself to customize its return value per test
import { useDashboardSummary as mockUseDashboardSummary } from '@/hooks/queries/useDashboardQuery';
// Import the mocked SpendingCard component to inspect its calls
import { SpendingCard as MockSpendingCard } from '@/components/spending-card';
// Import the default export of the mocked ChartModal
import MockChartModal from '@/components/dashboard/ChartModal';

// Mocks for next-intl, SpendingCard, ChartModal from previous step...
// (Keep existing mocks as they are)

jest.mock('@/hooks/queries/useDashboardQuery', () => ({
  useDashboardSummary: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key), // Simple t function
  useLocale: jest.fn(() => 'en'),
}));

// Mock SpendingCard
jest.mock('@/components/spending-card', () => ({
  SpendingCard: jest.fn(({ title, amount, previousLabel, previousAmount, onClick }) => (
    <div data-testid={`spending-card-${title?.toLowerCase().replace(/\s+/g, '-')}`}>
      <h3>{title}</h3>
      <p>Amount: {amount}</p>
      <p>{previousLabel}: {previousAmount}</p>
      {onClick && <button onClick={onClick}>Details</button>}
    </div>
  )),
}));

// Mock ChartModal
jest.mock('@/components/dashboard/ChartModal', () => ({
  __esModule: true, // This is important for modules with default exports
  default: jest.fn(({ open, type, onClose, userId }) => (
    open ? (
      <div data-testid="chart-modal">
        <p>Chart Modal: {type}</p>
        <p>User ID: {userId}</p>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )),
}));


describe('DashboardView', () => {
  // Typecast mockUseDashboardSummary to jest.Mock for TypeScript
  const useDashboardSummary = mockUseDashboardSummary as jest.Mock;
  const SpendingCard = MockSpendingCard as jest.Mock;
  const ChartModal = MockChartModal as jest.Mock;

  const mockDashboardData = {
    spent_today: 100000, spent_yesterday: 75000,
    spent_this_week: 500000, spent_last_week: 400000,
    spent_this_month: 2000000, spent_last_month: 1500000,
  };
  const userId = "test-user-123";

  beforeEach(() => {
    // Reset mocks before each test
    useDashboardSummary.mockReset();
    SpendingCard.mockClear();
    ChartModal.mockClear();

    // Default successful data for most tests, can be overridden in specific tests
    useDashboardSummary.mockReturnValue({
      data: mockDashboardData,
      isLoading: false, isError: false, error: null,
    });
  });

  it('should display loading skeletons when data is loading', () => {
    useDashboardSummary.mockReturnValue({ // Override default
      data: null,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<DashboardView userId={userId} />);

    const pulseDivs = screen.getAllByText('', { selector: 'div.animate-pulse' });
    expect(pulseDivs.length).toBe(3);

    pulseDivs.forEach(div => {
      expect(div.querySelector('div.h-4.bg-gray-200.rounded.w-1\\/2.mb-4')).toBeInTheDocument();
      expect(div.querySelector('div.h-8.bg-gray-200.rounded.w-3\\/4.mb-2')).toBeInTheDocument();
      expect(div.querySelector('div.h-3.bg-gray-200.rounded.w-1\\/3')).toBeInTheDocument();
    });
  });

  it('should display an error message when data fetching fails', () => {
    const errorMessage = 'Network Error';
    useDashboardSummary.mockReturnValue({ // Override default
      data: null,
      isLoading: false,
      isError: true,
      error: { message: errorMessage },
    });

    render(<DashboardView userId={userId} />);

    expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should display spending cards with correct data when fetching succeeds', () => {
    // Uses default mock from beforeEach
    render(<DashboardView userId={userId} />);

    expect(SpendingCard).toHaveBeenCalledTimes(3);

    expect(SpendingCard).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'today',
        amount: mockDashboardData.spent_today,
        previousLabel: 'yesterday',
        previousAmount: mockDashboardData.spent_yesterday,
      }),
      expect.anything()
    );

    expect(SpendingCard).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'thisWeek',
        amount: mockDashboardData.spent_this_week,
        previousLabel: 'lastWeek',
        previousAmount: mockDashboardData.spent_last_week,
        onClick: expect.any(Function),
      }),
      expect.anything()
    );

    expect(SpendingCard).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'thisMonth',
        amount: mockDashboardData.spent_this_month,
        previousLabel: 'lastMonth',
        previousAmount: mockDashboardData.spent_last_month,
        onClick: expect.any(Function),
      }),
      expect.anything()
    );
  });

  it('should use fallback data if dashboardData is null', () => {
    useDashboardSummary.mockReturnValue({ // Override default
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    });

    const fallbackData = {
        spent_today: 0, spent_yesterday: 0,
        spent_this_week: 0, spent_last_week: 0,
        spent_this_month: 0, spent_last_month: 0,
    };

    render(<DashboardView userId={userId} />);

    expect(SpendingCard).toHaveBeenCalledTimes(3);

    expect(SpendingCard).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'today',
        amount: fallbackData.spent_today,
        previousLabel: 'yesterday',
        previousAmount: fallbackData.spent_yesterday,
      }),
      expect.anything()
    );

     expect(SpendingCard).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'thisWeek',
        amount: fallbackData.spent_this_week,
        previousLabel: 'lastWeek',
        previousAmount: fallbackData.spent_last_week,
        onClick: expect.any(Function),
      }),
      expect.anything()
    );

    expect(SpendingCard).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'thisMonth',
        amount: fallbackData.spent_this_month,
        previousLabel: 'lastMonth',
        previousAmount: fallbackData.spent_last_month,
        onClick: expect.any(Function),
      }),
      expect.anything()
    );
  });

  describe('ChartModal interactions', () => {
    it('should initially render ChartModal as closed', () => {
      render(<DashboardView userId={userId} />);
      expect(screen.queryByTestId('chart-modal')).not.toBeInTheDocument();
      // Also check it wasn't called with open:true if it's always rendered
      const lastCall = ChartModal.mock.calls[ChartModal.mock.calls.length - 1];
      if (lastCall) { // It might not be called at all if it's conditionally rendered and closed
        expect(lastCall[0].open).toBe(false);
      }
    });

    it('should open ChartModal with type "week" when weekly SpendingCard is clicked', () => {
      render(<DashboardView userId={userId} />);

      const weeklyCard = screen.getByTestId('spending-card-thisweek');
      const weeklyCardButton = weeklyCard.querySelector('button');
      expect(weeklyCardButton).toBeInTheDocument();

      fireEvent.click(weeklyCardButton!);

      expect(ChartModal).toHaveBeenLastCalledWith(
        expect.objectContaining({
          open: true,
          type: 'week',
          userId: userId,
          onClose: expect.any(Function),
        }),
        {} // Second argument to React component calls is context (empty object here)
      );
      expect(screen.getByTestId('chart-modal')).toBeInTheDocument();
      expect(screen.getByText('Chart Modal: week')).toBeInTheDocument();
    });

    it('should open ChartModal with type "month" when monthly SpendingCard is clicked', () => {
      render(<DashboardView userId={userId} />);

      const monthlyCard = screen.getByTestId('spending-card-thismonth');
      const monthlyCardButton = monthlyCard.querySelector('button');
      expect(monthlyCardButton).toBeInTheDocument();

      fireEvent.click(monthlyCardButton!);

      expect(ChartModal).toHaveBeenLastCalledWith(
        expect.objectContaining({
          open: true,
          type: 'month',
          userId: userId,
          onClose: expect.any(Function),
        }),
        {}
      );
      expect(screen.getByTestId('chart-modal')).toBeInTheDocument();
      expect(screen.getByText('Chart Modal: month')).toBeInTheDocument();
    });

    it('should close ChartModal when its onClose prop is called (via mock Close button)', () => {
      render(<DashboardView userId={userId} />);

      const weeklyCard = screen.getByTestId('spending-card-thisweek');
      const weeklyCardButton = weeklyCard.querySelector('button');
      fireEvent.click(weeklyCardButton!);

      expect(ChartModal).toHaveBeenLastCalledWith(
        expect.objectContaining({ open: true, type: 'week' }), {}
      );
      expect(screen.getByTestId('chart-modal')).toBeInTheDocument();

      // Our mock ChartModal has a 'Close' button that calls the passed onClose prop
      const closeButtonInModal = screen.getByRole('button', { name: /Close/i });
      fireEvent.click(closeButtonInModal);

      expect(ChartModal).toHaveBeenLastCalledWith(
        expect.objectContaining({ open: false, type: null }), // type becomes null when closed
        {}
      );
       expect(screen.queryByTestId('chart-modal')).not.toBeInTheDocument();
    });
  });
});
