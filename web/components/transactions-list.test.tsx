import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TransactionsList } from './transactions-list';
import { Transaction } from '@/models/transaction';

// --- MOCKS ---
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key), // Simple t function
}));

jest.mock('@/utils/category-icons', () => ({
  getCategoryIcon: jest.fn(() => () => <svg data-testid="mock-category-icon" />),
}));

jest.mock('@/utils/currency', () => ({
  formatIDR: jest.fn((value: number) => `IDR ${value}`),
}));
// --- END MOCKS ---

// Access the mocks for assertions
const mockGetCategoryIcon = jest.requireMock('@/utils/category-icons').getCategoryIcon as jest.Mock;
const mockFormatIDR = jest.requireMock('@/utils/currency').formatIDR as jest.Mock;

const mockTransactions: Transaction[] = [
  {
    id: '1',
    user_id: 'user1',
    date: new Date(2024, 0, 15).toISOString(), // Jan 15, 2024
    amount: 100000,
    category: 'Food',
    note: 'Lunch at restaurant',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'user1',
    date: new Date(2024, 0, 16).toISOString(), // Jan 16, 2024
    amount: 50000,
    category: 'Transport',
    note: 'Bus ticket home',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const formatDateForTest = (dateString: string) => {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric", month: "short", day: "numeric",
  }).format(new Date(dateString));
};

describe('TransactionsList', () => {
  beforeEach(() => {
    (jest.requireMock('next-intl').useTranslations as jest.Mock).mockClear();
    mockGetCategoryIcon.mockClear();
    mockFormatIDR.mockClear();
  });

  it('should display "noTransactions" message when the transaction list is empty', () => {
    render(<TransactionsList transactions={[]} />);
    expect(screen.getByText('noTransactions')).toBeInTheDocument();
  });

  it('should render a list of transactions correctly', () => {
    render(<TransactionsList transactions={mockTransactions} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBe(mockTransactions.length);

    mockTransactions.forEach((transaction, index) => {
      const item = listItems[index];
      expect(within(item).getByText(transaction.note)).toBeInTheDocument();
      expect(within(item).getByText(transaction.category.toLowerCase())).toBeInTheDocument();
      expect(mockGetCategoryIcon).toHaveBeenNthCalledWith(index + 1, transaction.category);
      expect(within(item).getByTestId('mock-category-icon')).toBeInTheDocument();
      expect(mockFormatIDR).toHaveBeenCalledWith(transaction.amount);
      expect(within(item).getByText(`IDR ${transaction.amount}`)).toBeInTheDocument();
      expect(within(item).getByText(formatDateForTest(transaction.date))).toBeInTheDocument();
    });
    expect(screen.getAllByTestId('mock-category-icon').length).toBe(mockTransactions.length);
  });

  it('should call onEditTransaction with the correct transaction when an item is clicked', () => {
    const mockOnEditTransaction = jest.fn();
    render(
      <TransactionsList
        transactions={mockTransactions}
        onEditTransaction={mockOnEditTransaction}
      />
    );

    const listItems = screen.getAllByRole('listitem');

    fireEvent.click(listItems[0]);
    expect(mockOnEditTransaction).toHaveBeenCalledTimes(1);
    expect(mockOnEditTransaction).toHaveBeenCalledWith(mockTransactions[0]);

    fireEvent.click(listItems[1]);
    expect(mockOnEditTransaction).toHaveBeenCalledTimes(2);
    expect(mockOnEditTransaction).toHaveBeenLastCalledWith(mockTransactions[1]);
  });

  it('should attach lastTransactionRef to the last item in the list', () => {
    const mockLastTransactionRef = jest.fn();
    render(
      <TransactionsList
        transactions={mockTransactions}
        lastTransactionRef={mockLastTransactionRef}
      />
    );

    expect(mockLastTransactionRef).toHaveBeenCalledTimes(1);
    const lastItemElement = screen.getAllByRole('listitem').pop();
    expect(mockLastTransactionRef).toHaveBeenCalledWith(lastItemElement);
  });

  it('should render edit tooltip structure when onEditTransaction is provided, and not when absent', () => {
    const mockOnEdit = () => {};
    const { rerender } = render(
      <TransactionsList transactions={mockTransactions} onEditTransaction={mockOnEdit} />
    );

    let listItemsWithEdit = screen.getAllByRole('listitem');
    listItemsWithEdit.forEach(item => {
      const tooltipTextElement = within(item).getByText('editTooltip'); // 'editTooltip' from mock translation
      expect(tooltipTextElement).toBeInTheDocument();
      // Check if the parent of the text has the specific styling of the inner tooltip div
      const innerTooltipDiv = tooltipTextElement.parentElement;
      expect(innerTooltipDiv).toHaveClass('bg-black/75 text-white px-3 py-1 rounded-md text-sm font-medium');
      // Check if the grandparent (the main hover-reveal div) is present
      const outerTooltipDiv = innerTooltipDiv?.parentElement;
      expect(outerTooltipDiv).toHaveClass('absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none');
    });

    // Rerender without onEditTransaction
    rerender(<TransactionsList transactions={mockTransactions} />);

    expect(screen.queryByText('editTooltip')).not.toBeInTheDocument();
    const listItemsWithoutEdit = screen.getAllByRole('listitem');
    listItemsWithoutEdit.forEach(item => {
      expect(within(item).queryByText('editTooltip')).not.toBeInTheDocument();
      // Verify the structural divs for the tooltip are also gone
      const innerTooltipDiv = item.querySelector('.bg-black\\/75'); // querySelector uses CSS selectors
      expect(innerTooltipDiv).not.toBeInTheDocument();
      const outerTooltipDiv = item.querySelector('.group-hover\\:opacity-100');
      expect(outerTooltipDiv).not.toBeInTheDocument();
    });
  });
});
