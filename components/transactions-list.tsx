"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Search } from "lucide-react"
import { formatIDR } from "@/utils/currency"
import type { Transaction } from "@/models/transaction"
import { getCategoryIcon } from "@/utils/category-icons"

type SortField = "date" | "amount" | "category"
type SortDirection = "asc" | "desc"

interface TransactionsListProps {
  transactions: Transaction[]
}

export function TransactionsList({ transactions: initialTransactions }: TransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [searchTerm, setSearchTerm] = useState("")

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to descending
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Filter and sort transactions
  const filteredAndSortedTransactions = [...transactions]
    .filter((transaction) => {
      if (!searchTerm) return true
      const searchLower = searchTerm.toLowerCase()
      return (
        transaction.note.toLowerCase().includes(searchLower) || transaction.category.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1

      switch (sortField) {
        case "date":
          return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime())
        case "amount":
          return multiplier * (a.amount - b.amount)
        case "category":
          return multiplier * a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

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
      {/* Search bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Sort controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleSort("date")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
            sortField === "date" ? "bg-black text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Date
          {sortField === "date" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </button>
        <button
          onClick={() => handleSort("amount")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
            sortField === "amount" ? "bg-black text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Amount
          {sortField === "amount" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </button>
        <button
          onClick={() => handleSort("category")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
            sortField === "category" ? "bg-black text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Category
          {sortField === "category" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </button>
      </div>

      {/* Transactions list */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No transactions found</div>
        ) : (
          <ul className="space-y-3">
            {filteredAndSortedTransactions.map((transaction) => {
              const CategoryIcon = getCategoryIcon(transaction.category)

              return (
                <li key={transaction.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
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
