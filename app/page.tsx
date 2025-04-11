"use client"

import { useState } from "react"
import { ChevronDown, Clock, CreditCard, Plus, User } from "lucide-react"

import { SpendingCard } from "@/components/spending-card"
import { Modal } from "@/components/ui/modal"
import { TransactionForm, type TransactionData } from "@/components/transaction-form"
import { TransactionsList } from "@/components/transactions-list"
import { sampleTransactions } from "@/models/transaction"

type TabType = "dashboard" | "transactions"

import ProtectedLayout from "@/components/ProtectedLayout";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")
  const [transactions, setTransactions] = useState(sampleTransactions)

  const handleAddTransaction = (data: TransactionData) => {
    // Create a new transaction with the form data
    const newTransaction = {
      id: `t${transactions.length + 1}`,
      amount: data.amount,
      category: data.category,
      note: data.note,
      date: new Date().toISOString(),
    }

    // Add the new transaction to the list
    setTransactions([newTransaction, ...transactions])
    setIsModalOpen(false)
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-md bg-white min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">My Accounts</h1>
            <ChevronDown className="h-6 w-6" />
          </div>
          <button className="rounded-full bg-gray-200 p-2">
            <User className="h-5 w-5 text-gray-500" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-hidden">
          {activeTab === "dashboard" ? (
            <div className="space-y-4">
              <SpendingCard
                title="Spent Today"
                amount={64300}
                change={-11}
                previousLabel="Yesterday"
                previousAmount={72500}
              />

              <SpendingCard
                title="Spent This Week"
                amount={410600}
                change={-18}
                previousLabel="Last Week"
                previousAmount={498000}
              />

              <SpendingCard
                title="Spent This Month"
                amount={1025900}
                change={-41}
                previousLabel="Last Month"
                previousAmount={2045000}
              />
            </div>
          ) : (
            <TransactionsList transactions={transactions} />
          )}
        </main>

        {/* Floating Action Button */}
        <div className="fixed bottom-20 right-4 md:right-1/2 md:translate-x-[11rem]">
          <button className="bg-black text-white rounded-full p-4 shadow-lg" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {/* Bottom Navigation */}
        <nav className="border-t border-gray-200 p-4 flex justify-around items-center">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center ${activeTab === "dashboard" ? "text-black" : "text-gray-400"}`}
          >
            <CreditCard className="h-6 w-6" />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex flex-col items-center ${activeTab === "transactions" ? "text-black" : "text-gray-400"}`}
          >
            <Clock className="h-6 w-6" />
            <span className="text-xs mt-1">Transactions</span>
          </button>
        </nav>

        {/* Transaction Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
          <TransactionForm onSubmit={handleAddTransaction} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      </div>
    </ProtectedLayout>
  )
}
