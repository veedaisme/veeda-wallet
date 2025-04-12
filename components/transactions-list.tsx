"use client"

import { getCategoryIcon } from "@/utils/category-icons"
import { formatIDR } from "@/utils/currency"
import type { Transaction } from "@/models/transaction"

interface TransactionsListProps {
  transactions: Transaction[]
  lastTransactionRef?: (node: HTMLLIElement | null) => void
}

export function TransactionsList({ transactions, lastTransactionRef }: TransactionsListProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Transactions list */}
      <div className="flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No transactions found</div>
        ) : (
          <ul className="space-y-3">
            {transactions.map((transaction, idx) => {
              const CategoryIcon = getCategoryIcon(transaction.category)
              const isLast = idx === transactions.length - 1
              return (
                <li
                  key={transaction.id}
                  className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
                  ref={isLast && lastTransactionRef ? lastTransactionRef : undefined}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <CategoryIcon className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="font-medium">{transaction.note}</h3>
                        <p className="text-sm text-gray-500">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatIDR(transaction.amount)}</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
