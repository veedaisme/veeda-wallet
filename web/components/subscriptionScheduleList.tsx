"use client"

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ProjectedSubscription, SubscriptionSummary } from '@/models/subscription'
import { SubscriptionCard } from '@/components/subscription-card'
import { formatIDR } from '@/utils/currency'
import { Switch } from '@/components/ui/switch'

interface SubscriptionsListProps {
  subscriptions: ProjectedSubscription[];
  summary: SubscriptionSummary | null;
  openAddSubscriptionModal?: () => void;
}

export function SubscriptionScheduleList({
  subscriptions,
  summary,
  openAddSubscriptionModal,
}: SubscriptionsListProps) {
  const tSub = useTranslations('subscriptions')
  
  // Feature flag for currency toggle
  const isCurrencyToggleEnabled = process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTION_CURRENCY_TOGGLE === 'true'
  
  // State - default to IDR when toggle is disabled
  const [showInIDR, setShowInIDR] = useState(true)
  
  // Sort subscriptions by projected payment date
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    return new Date(a.projected_payment_date).getTime() - new Date(b.projected_payment_date).getTime()
  })

  // Group subscriptions by month based on projected payment date
  const groupedSubscriptions = sortedSubscriptions.reduce<Record<string, ProjectedSubscription[]>>((acc, subscription) => {
    // Create month-year string as the group key
    const date = new Date(subscription.projected_payment_date)
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!acc[monthYear]) {
      acc[monthYear] = []
    }
    
    acc[monthYear].push(subscription)
    return acc
  }, {})
  
  // Get month name
  const getMonthName = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Summary and Actions Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            {summary && (
              <p className="text-gray-600">
                {tSub('upcomingThisMonth')}:{' '}
                <span className="text-lg font-semibold text-gray-800">
                  {formatIDR(summary.upcoming_this_month)}
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* Currency Toggle - only show when feature flag is enabled */}
            {isCurrencyToggleEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{showInIDR ? 'IDR' : tSub('original')}</span>
                <Switch
                  checked={showInIDR}
                  onCheckedChange={setShowInIDR}
                  aria-label={tSub('toggleCurrency')}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      {Object.keys(groupedSubscriptions).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedSubscriptions).map(([monthYear, subs]) => (
            <div key={monthYear} className="space-y-3">
              <h3 className="text-md font-medium text-gray-500">{getMonthName(monthYear)}</h3>
              <div className="space-y-3">
                {subs.map(subscription => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    showInIDR={showInIDR}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">{tSub('noSubscriptions')}</p>
          {openAddSubscriptionModal && (
            <button
              onClick={openAddSubscriptionModal}
              className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              {tSub('addYourFirst')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
