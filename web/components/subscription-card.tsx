"use client"

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { formatDate } from '@/utils/date'
import { Subscription, ProjectedSubscription } from '@/models/subscription'
import { formatIDR } from '@/utils/currency'
import { Edit, Trash2 } from 'lucide-react'
import { PLATFORM_LOGO_MAP, DEFAULT_PLATFORM_LOGO } from '@/config/platforms';

// Helper function to capitalize each word
const capitalizeWords = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface SubscriptionCardProps {
  subscription: ProjectedSubscription
  showInIDR: boolean
  exchangeRates: any[]
  onEdit: (subscription: ProjectedSubscription) => void
  onDelete: (subscription: ProjectedSubscription) => void
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
    const payment_date_obj = new Date(subscription.projected_payment_date)
    const diffTime = payment_date_obj.getTime() - today.getTime()
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

  // Calculate due status for border color
  const today = new Date();
  const payment_date_obj = new Date(subscription.projected_payment_date);
  const diffDays = Math.ceil((payment_date_obj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  let borderColor = "border-[hsl(var(--border))]";
  if (diffDays < 0) borderColor = "border-[hsl(var(--destructive))]";
  else if (diffDays <= 3) borderColor = "border-[hsl(var(--primary))]";

  return (
    <div className="border border-[hsl(var(--border))] rounded-lg p-4 bg-[hsl(var(--card))] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-lg text-[hsl(var(--foreground))] truncate">{capitalizeWords(subscription.provider_name)}</span>
            <span className="text-[hsl(var(--muted-foreground))] text-sm truncate">{tSub(subscription.frequency)}</span>
          </div>
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
        <p className="font-bold text-xl">
          <span className="inline-block px-3 py-1 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
            {amount}
          </span>
          {showInIDR && subscription.currency !== 'IDR' && (
            <span className="text-xs text-[hsl(var(--muted-foreground))] block">
              ({subscription.amount.toFixed(2)} {subscription.currency})
            </span>
          )}
        </p>
        <div className="text-right">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{formatDate(subscription.projected_payment_date)}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{daysUntilPayment()}</p>
        </div>
      </div>
    </div>
  )
}
