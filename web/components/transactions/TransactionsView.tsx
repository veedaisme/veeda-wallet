"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from 'next-intl';
import { TransactionsList } from "@/components/transactions-list";
import { EditTransactionModal } from "@/components/edit-transaction-modal";
import { supabase } from "@/lib/supabaseClient";
import { Transaction } from "@/models/transaction";
import { TransactionData } from "@/components/transaction-form";

type SortField = "date" | "amount";
type SortDirection = "asc" | "desc";

interface TransactionsViewProps {
  userId: string | null;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ userId }) => {
  const tTrans = useTranslations('transactions');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [hasMore, setHasMore] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  
  // Edit transaction state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Sorting and searching state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchTerm, setSearchTerm] = useState("");

  // Infinite scroll ref
  const observer = useRef<IntersectionObserver | null>(null);

  // Fetch paginated transactions with sorting and searching
  const fetchTransactions = useCallback(async (reset = false) => {
    if (!userId) return;
    setLoadingTransactions(true);
    const from = (reset ? 0 : page * pageSize);
    const to = from + pageSize - 1;
    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order(sortField, { ascending: sortDirection === "asc" });

    if (searchTerm) {
      query = query.ilike("note", `%${searchTerm}%`);
    }

    const { data, error } = await query.range(from, to);

    if (error) {
      setError(error.message);
    } else {
      if (reset) {
        setTransactions(data);
        setPage(0);
      } else {
        setTransactions(prev => [...prev, ...data]);
      }
      setHasMore(data.length === pageSize);
      if (!reset) setPage(prev => prev + 1);
    }
    setLoadingTransactions(false);
  }, [userId, pageSize, sortField, sortDirection, searchTerm, page]);

  // Reset and fetch when sort/search changes or when userId changes
  useEffect(() => {
    if (userId) {
      fetchTransactions(true);
    }
  }, [userId, sortField, sortDirection, searchTerm, fetchTransactions]);

  // Infinite scroll observer
  const lastTransactionRef = useCallback((node: HTMLLIElement | null) => {
    if (loadingTransactions) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        fetchTransactions();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingTransactions, hasMore, fetchTransactions]);

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
    
    // Set the time to noon to avoid timezone issues
    const dateWithoutTime = new Date(data.date);
    dateWithoutTime.setHours(12, 0, 0, 0);
    
    const updatedTransaction = {
      amount: data.amount,
      category: data.category,
      note: data.note,
      date: dateWithoutTime.toISOString(),
    };
    
    const { error: updateError } = await supabase
      .from("transactions")
      .update(updatedTransaction)
      .eq('id', data.id)
      .select()
      .single();
      
    if (updateError) {
      throw new Error(updateError.message);
    }
    
    // Refresh the transaction list to ensure correct sorting after date changes
    setPage(0); // Reset to first page
    fetchTransactions(true); // Refresh the transaction list
    
    return;
  };
  
  const openEditModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

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
        onEditTransaction={openEditModal}
      />
      
      {loadingTransactions && (
        <div className="flex justify-center mt-4">
          <span className="text-gray-500">Loading...</span>
        </div>
      )}

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        transaction={selectedTransaction}
        onUpdateTransaction={handleEditTransaction}
      />
    </>
  );
};

export default TransactionsView;
