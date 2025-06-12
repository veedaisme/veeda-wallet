"use client"

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ProjectedSubscription, SubscriptionPaymentSummary } from '@/models/subscription'
import { SubscriptionCard } from '@/components/subscription-card'
import { formatIDR } from '@/utils/currency'
import { Switch } from '@/components/ui/switch'
import { usePaySubscription, usePaymentFeatureFlag } from '@/hooks/queries/useUnpaidSubscriptionsQuery'

interface UnpaidSubscriptionsListProps {
  subscriptions: ProjectedSubscription[];
  summary: SubscriptionPaymentSummary | null;
}

export function UnpaidSubscriptionScheduleList({
  subscriptions,
  summary,
}: UnpaidSubscriptionsListProps) {
  const tSub = useTranslations('subscriptions')
  const { isEnabled: isPaymentFeatureEnabled } = usePaymentFeatureFlag()
  const { mutate: paySubscription, isPending: isPaymentLoading } = usePaySubscription()
  
  // Feature flag for currency toggle
  const isCurrencyToggleEnabled = process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTION_CURRENCY_TOGGLE === 'true'
  
  // State - default to IDR when toggle is disabled
  const [showInIDR, setShowInIDR] = useState(true)
  const [payingPaymentId, setPayingPaymentId] = useState<string | null>(null)

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

  // Handle payment action
  const handlePayment = async (subscription: ProjectedSubscription) => {
    if (!subscription.payment_id) {
      console.error('No payment ID found for subscription')
      return
    }

    setPayingPaymentId(subscription.payment_id)
    
    try {
      await paySubscription({
        paymentId: subscription.payment_id,
        paymentData: {
          // Use default values - amount will be calculated from subscription
          category: 'Subscriptions',
          note: `Payment for ${subscription.provider_name} - ${subscription.projected_payment_date}`
        }
      })
    } catch (error) {
      console.error('Payment failed:', error)
      // Error handling is done in the mutation's onError callback
    } finally {
      setPayingPaymentId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary and Actions Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            {summary && (
              <div className="space-y-1">
                <p className="text-gray-600">
                  {tSub('totalUnpaid')}:{' '}
                  <span className="text-lg font-semibold text-gray-800">
                    {formatIDR(summary.total_unpaid_amount)}
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  {summary.unpaid_count} unpaid items
                  {summary.overdue_count > 0 && (
                    <span className="text-red-600 ml-2">
                      ({summary.overdue_count} overdue)
                    </span>
                  )}
                </p>
                {summary.next_payment_date && (
                  <p className="text-sm text-blue-600">
                    Next: {formatIDR(summary.next_payment_amount || 0)} on {summary.next_payment_date}
                  </p>
                )}
              </div>
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
                    key={`${subscription.id}-${subscription.projected_payment_date}`}
                    subscription={subscription}
                    showInIDR={showInIDR}
                    showPayButton={isPaymentFeatureEnabled}
                    onPay={handlePayment}
                    isPaymentLoading={isPaymentLoading && payingPaymentId === subscription.payment_id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="space-y-2">
            <p className="text-gray-500">{tSub('noUnpaidSubscriptions')}</p>
            <p className="text-sm text-gray-400">All your subscription payments are up to date!</p>
          </div>
        </div>
      )}

      {/* Payment Feature Status */}
      {!isPaymentFeatureEnabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            💡 Payment functionality is currently disabled. Enable it in your environment settings to pay subscriptions directly.
          </p>
        </div>
      )}
    </div>
  )
}
