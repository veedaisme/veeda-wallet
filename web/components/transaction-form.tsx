"use client"

import type React from "react"

import { useState } from "react"
import { formatIDR, parseIDR } from "@/utils/currency"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TransactionFormProps {
  onSubmit: (data: TransactionData) => void
  onCancel: () => void
  loading?: boolean
  initialData?: TransactionData
}

export interface TransactionData {
  amount: number
  note: string
  category: string
  date: Date
  id?: string
}

const CATEGORIES = [
  "Food",
  "Transportation",
  "Entertainment",
  "Housing",
  "Utilities",
  "Shopping",
  "Health",
  "Education",
  "Travel",
  "Other",
]

export function TransactionForm({ onSubmit, onCancel, loading = false, initialData }: TransactionFormProps) {
  const [amount, setAmount] = useState(initialData ? formatIDR(initialData.amount).replace("Rp", "").trim() : "")
  const [note, setNote] = useState(initialData?.note || "")
  const [category, setCategory] = useState(initialData?.category || "")
  const [date, setDate] = useState<Date | undefined>(initialData?.date || new Date())
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!amount || isNaN(Number(amount.replace(/[^\d]/g, ""))) || Number(amount.replace(/[^\d]/g, "")) <= 0) {
      newErrors.amount = "Please enter a valid amount"
    }

    if (!category) {
      newErrors.category = "Please select a category"
    }
    
    if (!date) {
      newErrors.date = "Please select a date"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm() && date) {
      onSubmit({
        amount: parseIDR(amount),
        note,
        category,
        date,
        ...(initialData?.id ? { id: initialData.id } : {})
      })
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get only numbers from input
    const value = e.target.value.replace(/[^\d]/g, "")

    if (value === "") {
      setAmount("")
      return
    }

    // Convert to number and format as IDR
    const numValue = Number.parseInt(value, 10)
    setAmount(formatIDR(numValue).replace("Rp", "").trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount (Rp)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
          <input
            id="amount"
            type="text"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            className={`w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none ${
              errors.amount ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
        {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
          Note
        </label>
        <input
          id="note"
          type="text"
          placeholder="Coffee, lunch, etc."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none ${
            errors.category ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
                errors.date ? "border-red-500" : ""
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? (initialData ? "Updating..." : "Adding...") : (initialData ? "Update Transaction" : "Add Transaction")}
        </button>
      </div>
    </form>
  )
}
