"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl';
import { Modal } from "@/components/ui/modal"
import { TransactionForm, type TransactionData } from "@/components/transaction-form"
import type { Transaction } from "@/models/transaction"

interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onUpdateTransaction: (data: TransactionData) => Promise<void>
}

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onUpdateTransaction,
}: EditTransactionModalProps) {
  const tTrans = useTranslations('transactions');
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!transaction) return null

  const handleUpdateTransaction = async (data: TransactionData) => {
    setLoading(true)
    setError(null)
    
    try {
      await onUpdateTransaction(data)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : tTrans('failedUpdate'))
    } finally {
      setLoading(false)
    }
  }

  // Convert string date to Date object
  const initialData: TransactionData = {
    id: transaction.id,
    amount: transaction.amount,
    note: transaction.note,
    category: transaction.category,
    date: new Date(transaction.date)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tTrans('edit')}>
      <TransactionForm 
        onSubmit={handleUpdateTransaction} 
        onCancel={onClose} 
        loading={loading}
        initialData={initialData}
      />
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </Modal>
  )
}
