"use client"

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { formatDate } from '@/utils/date'
import { Subscription } from '@/models/subscription'
import { formatIDR } from '@/utils/currency'
import { Edit, Trash2 } from 'lucide-react'

interface SubscriptionCardProps {
  subscription: Subscription
  showInIDR: boolean
  exchangeRates: any[]
  onEdit: (subscription: Subscription) => void
  onDelete: (subscription: Subscription) => void
}

export function SubscriptionCard({ 
  subscription, 
  showInIDR, 
  exchangeRates,
  onEdit,
  onDelete
}: SubscriptionCardProps) {
  const tSub = useTranslations('subscriptions')
  const [amount, setAmount] = useState<string>('')
  
  // Format amount based on currency
  useEffect(() => {
    if (showInIDR && subscription.currency !== 'IDR') {
      // Find the exchange rate
      const rate = exchangeRates?.find(r => r.base_currency === subscription.currency)
      if (rate) {
        const amountInIDR = subscription.amount * rate.rate
        setAmount(formatIDR(amountInIDR))
      } else {
        setAmount(`${subscription.amount} ${subscription.currency}`)
      }
    } else if (subscription.currency === 'IDR') {
      setAmount(formatIDR(subscription.amount))
    } else {
      // Non-IDR currency when not showing in IDR
      setAmount(`${subscription.amount.toFixed(2)} ${subscription.currency}`)
    }
  }, [subscription, showInIDR, exchangeRates])

  const daysUntilPayment = () => {
    const today = new Date()
    const paymentDate = new Date(subscription.next_payment_date)
    const diffTime = paymentDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return tSub('dueToday')
    } else if (diffDays === 1) {
      return tSub('dueTomorrow')
    } else if (diffDays < 0) {
      return tSub('pastDue')
    } else {
      return tSub('dueInDays', { days: diffDays })
    }
  }

  return (
    <div className="border border-[hsl(var(--border))] rounded-lg p-4 bg-[hsl(var(--card))] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg text-[hsl(var(--foreground))]">{subscription.provider_name}</h3>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">{tSub(subscription.frequency)}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(subscription)}
            className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" 
            aria-label={tSub('edit')}
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(subscription)}
            className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]" 
            aria-label={tSub('delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-end">
        <p className="font-bold text-lg text-[hsl(var(--foreground))]">
          {amount}
          {showInIDR && subscription.currency !== 'IDR' && (
            <span className="text-xs text-[hsl(var(--muted-foreground))] block">
              ({subscription.amount.toFixed(2)} {subscription.currency})
            </span>
          )}
        </p>
        <div className="text-right">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{formatDate(subscription.next_payment_date)}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{daysUntilPayment()}</p>
        </div>
      </div>
    </div>
  )
}
