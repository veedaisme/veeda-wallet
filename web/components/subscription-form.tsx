"use client"

import type React from "react"
import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { formatIDR, parseIDR } from "@/utils/currency"
import { FREQUENCIES, COMMON_CURRENCIES, type SubscriptionData } from "@/models/subscription"
import { useLocale } from 'next-intl'
import { id as idLocale } from 'date-fns/locale'

import { COMMON_PLATFORMS, PlatformConfig } from "@/config/platforms";

interface SubscriptionFormProps {
  onSubmit: (data: SubscriptionData) => void
  onCancel: () => void
  loading?: boolean
  initialData?: SubscriptionData
}

export function SubscriptionForm({ onSubmit, onCancel, loading = false, initialData }: SubscriptionFormProps) {
  const tSub = useTranslations('subscriptions')
  const locale = useLocale()
  
  const [providerName, setProviderName] = useState(initialData?.provider_name || "")
  const [amount, setAmount] = useState(initialData 
    ? initialData.currency === 'IDR' 
      ? formatIDR(initialData.amount).replace("Rp", "").trim() 
      : initialData.amount.toString()
    : "")
  const [currency, setCurrency] = useState(initialData?.currency || "IDR")
  const [frequency, setFrequency] = useState(initialData?.frequency || "monthly")
  const [paymentDate, setPaymentDate] = useState<Date>(initialData?.payment_date ? new Date(initialData.payment_date) : new Date())
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!providerName.trim()) {
      newErrors.providerName = tSub('errorProviderRequired')
    }

    if (!amount) {
      newErrors.amount = tSub('errorInvalidAmount')
    } else {
      // Different validation for IDR (no decimals) vs other currencies (allow decimals)
      if (currency === 'IDR') {
        if (isNaN(Number(amount.replace(/[^\d]/g, ""))) || Number(amount.replace(/[^\d]/g, "")) <= 0) {
          newErrors.amount = tSub('errorInvalidAmount')
        }
      } else {
        if (isNaN(Number(amount)) || Number(amount) <= 0) {
          newErrors.amount = tSub('errorInvalidAmount')
        }
      }
    }

    if (!currency) {
      newErrors.currency = tSub('errorSelectCurrency')
    }

    if (!frequency) {
      newErrors.frequency = tSub('errorSelectFrequency')
    }
    
    if (!(paymentDate instanceof Date) || isNaN(paymentDate.getTime())) {
      newErrors.paymentDate = tSub('errorSelectDate')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm() && paymentDate) {
      const parsedAmount = currency === 'IDR' 
        ? parseIDR(amount) 
        : parseFloat(amount)
        
      onSubmit({
        provider_name: providerName,
        amount: parsedAmount,
        currency,
        frequency: frequency as 'monthly' | 'quarterly' | 'annually',
        payment_date: paymentDate,
        ...(initialData?.id ? { id: initialData.id } : {})
      })
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // For IDR, format with thousand separators
    if (currency === 'IDR') {
      // Get only numbers from input
      const value = e.target.value.replace(/[^\d]/g, "")

      if (value === "") {
        setAmount("")
        return
      }

      // Convert to number and format as IDR
      const numValue = Number.parseInt(value, 10)
      setAmount(formatIDR(numValue).replace("Rp", "").trim())
    } else {
      // For other currencies, allow decimal input
      setAmount(e.target.value)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="providerName" className="block text-sm font-medium text-gray-700 mb-1">
          {tSub('providerName')}
        </label>
        <select
          id="providerName"
          value={providerName && COMMON_PLATFORMS.some((p: PlatformConfig) => p.name === providerName) ? providerName : 'other'}
          onChange={(e) => {
            if (e.target.value === 'other') {
              setProviderName('');
            } else {
              setProviderName(e.target.value);
            }
          }}
          className={`w-full p-2 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none ${
            errors.providerName ? "border-red-500" : ""
          }`}
        >
          {COMMON_PLATFORMS.map((platform: PlatformConfig) => (
            <option key={platform.name} value={platform.name}>{platform.name}</option>
          ))}
          <option value="other">Other</option>
        </select>
        {/* Show free text input if 'Other' is selected */}
        {(!providerName || !COMMON_PLATFORMS.some((p: PlatformConfig) => p.name === providerName)) && (
          <input
            type="text"
            placeholder={tSub('placeholderProvider')}
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            className={`mt-2 w-full p-2 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none ${
              errors.providerName ? "border-red-500" : ""
            }`}
          />
        )}
        {errors.providerName && <p className="mt-1 text-sm text-red-500">{errors.providerName}</p>}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            {tSub('amount')}
          </label>
          <input
            id="amount"
            type="text"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            className={`w-full p-2 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none ${
              errors.amount ? "border-red-500" : ""
            }`}
          />
          {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
        </div>

        <div className="w-full md:w-1/3">
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            {tSub('currency')}
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value)
              // Reset amount when currency changes
              setAmount("")
            }}
            className={`w-full p-2 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none ${
              errors.currency ? "border-red-500" : ""
            }`}
          >
            <option value="" disabled>
              {tSub('selectCurrency')}
            </option>
            {COMMON_CURRENCIES.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
          {errors.currency && <p className="mt-1 text-sm text-red-500">{errors.currency}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
          {tSub('frequency')}
        </label>
        <select
          id="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className={`w-full p-2 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none ${
            errors.frequency ? "border-red-500" : ""
          }`}
        >
          <option value="" disabled>
            {tSub('selectFrequency')}
          </option>
          {FREQUENCIES.map((freq) => (
            <option key={freq} value={freq}>
              {tSub(freq)}
            </option>
          ))}
        </select>
        {errors.frequency && <p className="mt-1 text-sm text-red-500">{errors.frequency}</p>}
      </div>

      <div>
        <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
          {tSub('paymentDate')}
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !paymentDate && "text-muted-foreground",
                errors.paymentDate ? "border-red-500" : "border border-[hsl(var(--border))]"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {paymentDate ? format(paymentDate, 'PPP', { locale: locale === 'id' ? idLocale : undefined }) : <span>{tSub('pickDate')}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={paymentDate}
              onSelect={setPaymentDate}
              initialFocus
              locale={locale === 'id' ? idLocale : undefined}
            />
          </PopoverContent>
        </Popover>
        {errors.paymentDate && <p className="mt-1 text-sm text-red-500">{errors.paymentDate}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 border border-[hsl(var(--border))] rounded-lg text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
        >
          {tSub('cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 px-4 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:bg-[hsl(var(--primary)/.8)] disabled:bg-[hsl(var(--muted))]"
        >
          {loading ? tSub('saving') : initialData ? tSub('update') : tSub('add')}
        </button>
      </div>
    </form>
  )
}
