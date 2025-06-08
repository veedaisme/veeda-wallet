"use client";

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from 'next-intl';
import { TransactionsList } from "@/components/transactions-list";
import { EditTransactionModal } from "@/components/edit-transaction-modal";
import { Transaction } from "@/models/transaction";
import { TransactionData } from "@/components/transaction-form";
import {
  useTransactionsPaginated,
  useUpdateTransaction,
  type SortField,
  type SortDirection,
  type TransactionFilters
} from "@/hooks/queries/useTransactionsQuery";
import { useAppStore } from "@/stores/appStore";
import { TransactionListSkeleton, TransactionSearchSkeleton } from "@/components/ui/skeletons";

interface TransactionsViewProps {
  userId: string | null;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ userId }) => {
  const tTrans = useTranslations('transactions');

  // UI state from Zustand store
  const {
    selectedTransaction,
    isEditTransactionModalOpen,
    openEditTransactionModal,
    closeEditTransactionModal,
  } = useAppStore();

  // Local state for filters and sorting
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchTerm, setSearchTerm] = useState("");

  // Infinite scroll ref
  const observer = useRef<IntersectionObserver | null>(null);

  // Memoized filters to prevent unnecessary re-renders
  const filters = useMemo<TransactionFilters>(() => ({
    sortField,
    sortDirection,
    searchTerm: searchTerm.trim() || undefined,
  }), [sortField, sortDirection, searchTerm]);

  // React Query hooks
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactionsPaginated(userId, filters);

  const updateTransactionMutation = useUpdateTransaction();

  // Flatten paginated data into a single array
  const transactions = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.transactions);
  }, [data?.pages]);

  // Infinite scroll observer
  const lastTransactionRef = useCallback((node: HTMLLIElement | null) => {
    if (isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observer.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleEditTransaction = async (data: TransactionData) => {
    if (!userId || !data.id) return;

    try {
      // Convert Date to string if necessary
      const dateString = data.date instanceof Date ? data.date.toISOString() : data.date;

      await updateTransactionMutation.mutateAsync({
        transactionId: data.id,
        transactionData: {
          amount: data.amount,
          category: data.category,
          note: data.note,
          date: dateString,
        },
        userId,
      });

      // Close the modal on success
      closeEditTransactionModal();
    } catch (error) {
      // Error handling is managed by the mutation hook
      throw error;
    }
  };

  // Show loading skeleton on initial load
  if (isLoading) {
    return (
      <>
        <TransactionSearchSkeleton />
        <TransactionListSkeleton count={8} />
      </>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load transactions</p>
          <p className="text-sm text-gray-500">
            {error?.message || 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search and sort controls */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
        <input
          type="text"
          placeholder={tTrans('search')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-64 pl-3 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleSort("date")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
              sortField === "date" ? "bg-black text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {tTrans('date')}
            {sortField === "date" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
          </button>
          <button
            onClick={() => handleSort("amount")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
              sortField === "amount" ? "bg-black text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {tTrans('amount')}
            {sortField === "amount" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
          </button>
        </div>
      </div>

      <TransactionsList
        transactions={transactions}
        lastTransactionRef={lastTransactionRef}
        onEditTransaction={openEditTransactionModal}
      />

      {isFetchingNextPage && (
        <div className="flex justify-center mt-4">
          <span className="text-gray-500">Loading more...</span>
        </div>
      )}

      {/* Show message when no transactions found */}
      {transactions.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm ? 'No transactions found matching your search.' : 'No transactions yet.'}
          </p>
        </div>
      )}

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isEditTransactionModalOpen}
        onClose={closeEditTransactionModal}
        transaction={selectedTransaction}
        onUpdateTransaction={handleEditTransaction}
      />
    </>
  );
};

export default TransactionsView;
