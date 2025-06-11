import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TransactionsView } from './TransactionsView';
// Import the mock TransactionsList to inspect its props
import { TransactionsList as MockTransactionsList } from '@/components/transactions-list';


// --- MOCKS ---

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key), // Simple t function
}));

// Mock useTransactionsQuery
const mockUseTransactionsPaginated = jest.fn();
const mockUseUpdateTransaction = jest.fn();
jest.mock('@/hooks/queries/useTransactionsQuery', () => ({
  useTransactionsPaginated: mockUseTransactionsPaginated,
  useUpdateTransaction: mockUseUpdateTransaction,
}));

// Mock appStore
const mockOpenEditTransactionModal = jest.fn();
const mockCloseEditTransactionModal = jest.fn();
const mockSetSelectedTransaction = jest.fn();

const originalAppStore = jest.requireActual('@/stores/appStore');

jest.mock('@/stores/appStore', () => ({
  ...originalAppStore,
  useAppStore: jest.fn(() => ({
    selectedTransaction: null,
    isEditTransactionModalOpen: false,
    openEditTransactionModal: mockOpenEditTransactionModal,
    closeEditTransactionModal: mockCloseEditTransactionModal,
    setSelectedTransaction: mockSetSelectedTransaction,
  })),
}));

// Mock child components
jest.mock('@/components/transactions-list', () => ({
  TransactionsList: jest.fn(({ transactions, lastTransactionRef, onEditTransaction }) => (
    <div data-testid="mock-transactions-list">
      {transactions.map((tx: any) => (
        <div key={tx.id} onClick={() => onEditTransaction && onEditTransaction(tx)} data-testid={`transaction-item-${tx.id}`}>
          {tx.note}
        </div>
      ))}
      <div ref={lastTransactionRef} data-testid="mock-last-transaction-ref-target"></div>
    </div>
  )),
}));

jest.mock('@/components/edit-transaction-modal', () => ({
  EditTransactionModal: jest.fn(({ isOpen, onClose, transaction, onUpdateTransaction }) => (
    isOpen ? (
      <div data-testid="mock-edit-transaction-modal">
        <p>Editing: {transaction?.note}</p>
        <button onClick={() => onUpdateTransaction && onUpdateTransaction({ ...transaction, amount: 123 })}>Update</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )),
}));

jest.mock('@/components/ui/skeletons', () => ({
  TransactionSearchSkeleton: jest.fn(() => <div data-testid="mock-transaction-search-skeleton" />),
  TransactionListSkeleton: jest.fn(() => <div data-testid="mock-transaction-list-skeleton" />),
}));

// --- END MOCKS ---

const mockUserId = 'test-user-id-123';

// Mock transactions data to be used in tests
const sampleTransactions = [
  { id: 't1', user_id: mockUserId, date: new Date().toISOString(), amount: 100, category: 'Food', note: 'Lunch' },
  { id: 't2', user_id: mockUserId, date: new Date().toISOString(), amount: 50, category: 'Transport', note: 'Bus' },
];

describe('TransactionsView', () => {
  const setDefaultPaginatedMockData = (data = { pages: [{ data: { transactions: [], nextPage: null }, error: null }] }, options = {}) => {
    mockUseTransactionsPaginated.mockReturnValue({
      data,
      isLoading: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      ...options,
    });
  };

  const setDefaultUpdateMockSuccess = () => {
    mockUseUpdateTransaction.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
    });
  };

  beforeEach(() => {
    mockUseTransactionsPaginated.mockReset();
    mockUseUpdateTransaction.mockReset();

    const appStoreMock = jest.requireMock('@/stores/appStore').useAppStore as jest.Mock;
    appStoreMock.mockReset();
    appStoreMock.mockReturnValue({
        selectedTransaction: null,
        isEditTransactionModalOpen: false,
        openEditTransactionModal: mockOpenEditTransactionModal,
        closeEditTransactionModal: mockCloseEditTransactionModal,
        setSelectedTransaction: mockSetSelectedTransaction,
     });
    mockOpenEditTransactionModal.mockClear();
    mockCloseEditTransactionModal.mockClear();
    mockSetSelectedTransaction.mockClear();

    (jest.requireMock('@/components/transactions-list').TransactionsList as jest.Mock).mockClear();
    (jest.requireMock('@/components/edit-transaction-modal').EditTransactionModal as jest.Mock).mockClear();
    (jest.requireMock('@/components/ui/skeletons').TransactionSearchSkeleton as jest.Mock).mockClear();
    (jest.requireMock('@/components/ui/skeletons').TransactionListSkeleton as jest.Mock).mockClear();

    setDefaultPaginatedMockData();
    setDefaultUpdateMockSuccess();
  });

  it('should display skeletons when in loading state', () => {
    setDefaultPaginatedMockData(undefined, { isLoading: true });
    render(<TransactionsView userId={mockUserId} />);
    expect(screen.getByTestId('mock-transaction-search-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('mock-transaction-list-skeleton')).toBeInTheDocument();
  });

  it('should display error messages when data fetching fails', () => {
    const errorMessage = 'Custom error from API';
    setDefaultPaginatedMockData(undefined, {
      isLoading: false,
      isError: true,
      error: { message: errorMessage }
    });
    render(<TransactionsView userId={mockUserId} />);
    expect(screen.getByText('Failed to load transactions')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should render search input and sort buttons on successful initial load (even with no data)', () => {
    render(<TransactionsView userId={mockUserId} />);
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'date' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'amount' })).toBeInTheDocument();
  });

  it('should render TransactionsList with correct data when transactions are present', () => {
    setDefaultPaginatedMockData({
      pages: [{ data:{ transactions: sampleTransactions, nextPage: null }, error: null }]
    });

    render(<TransactionsView userId={mockUserId} />);

    expect(screen.getByTestId('mock-transactions-list')).toBeInTheDocument();

    const transactionsListProps = (MockTransactionsList as jest.Mock).mock.calls[0][0];
    expect(transactionsListProps.transactions).toEqual(sampleTransactions);

    expect(screen.getByText('Lunch')).toBeInTheDocument(); // Rendered by mock TransactionsList
    expect(screen.getByText('Bus')).toBeInTheDocument(); // Rendered by mock TransactionsList
  });

  it('should display "No transactions yet." message when no transactions exist and no search term is active', () => {
    // Default mock in beforeEach provides { pages: [{ data: { transactions: [], nextPage: null } }] }
    render(<TransactionsView userId={mockUserId} />);
    expect(screen.getByText('No transactions yet.')).toBeInTheDocument();
  });

  it('should display "No transactions found matching your search." message when no transactions match search', () => {
    // Default mock in beforeEach provides { pages: [{ data: { transactions: [], nextPage: null } }] }
    render(<TransactionsView userId={mockUserId} />);

    const searchInput = screen.getByPlaceholderText('search');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    // After search, the component should display the "no results for search" message
    expect(screen.getByText('No transactions found matching your search.')).toBeInTheDocument();
  });
});
