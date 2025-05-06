"use client"

import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { Subscription, SubscriptionSummary, type SubscriptionData } from '@/models/subscription'
import { Modal } from '@/components/ui/modal'
import { SubscriptionCard } from '@/components/subscription-card'
import { SubscriptionForm } from '@/components/subscription-form'
import { formatIDR } from '@/utils/currency'
import { Switch } from '@/components/ui/switch'

interface SubscriptionsListProps {
  subscriptions: Subscription[];
  summary: SubscriptionSummary | null;
  exchangeRates: any[];
  onUpdate: (data: SubscriptionData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
  openAddSubscriptionModal: () => void;
}

export function SubscriptionsList({
  subscriptions,
  summary,
  exchangeRates,
  onUpdate,
  onDelete,
  loading,
  openAddSubscriptionModal
}: SubscriptionsListProps) {
  const tSub = useTranslations('subscriptions')
  
  // State
  const [showInIDR, setShowInIDR] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  
  // Sort subscriptions by next payment date
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    return new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime()
  })

  // Group subscriptions by month
  const groupedSubscriptions = sortedSubscriptions.reduce<Record<string, Subscription[]>>((acc, subscription) => {
    // Create month-year string as the group key
    const date = new Date(subscription.next_payment_date)
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`
    
    if (!acc[monthYear]) {
      acc[monthYear] = []
    }
    
    acc[monthYear].push(subscription)
    return acc
  }, {})

  // Handle editing a subscription
  const handleEdit = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setIsEditModalOpen(true)
  }

  // Handle updating a subscription
  const handleUpdate = async (data: SubscriptionData) => {
    await onUpdate(data)
    setIsEditModalOpen(false)
  }

  // Handle deleting a subscription
  const handleDelete = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setIsDeleteModalOpen(true)
  }

  // Confirm delete subscription
  const confirmDelete = async () => {
    if (selectedSubscription) {
      await onDelete(selectedSubscription.id)
      setIsDeleteModalOpen(false)
    }
  }

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
            <h2 className="text-xl font-bold">{tSub('subscriptions')}</h2>
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
            {/* Currency Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{showInIDR ? 'IDR' : tSub('original')}</span>
              <Switch
                checked={showInIDR}
                onCheckedChange={setShowInIDR}
                aria-label={tSub('toggleCurrency')}
              />
            </div>
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
                    exchangeRates={exchangeRates}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">{tSub('noSubscriptions')}</p>
          <button
            onClick={openAddSubscriptionModal}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            {tSub('addYourFirst')}
          </button>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {selectedSubscription && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={tSub('editSubscription')}>
          <SubscriptionForm
            initialData={{
              id: selectedSubscription.id,
              provider_name: selectedSubscription.provider_name,
              amount: selectedSubscription.amount,
              currency: selectedSubscription.currency,
              frequency: selectedSubscription.frequency,
              next_payment_date: new Date(selectedSubscription.next_payment_date)
            }}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
            loading={loading}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {selectedSubscription && (
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={tSub('confirmDelete')}>
          <div className="p-4">
            <p className="mb-4">
              {(() => {
                const text = tSub('deleteConfirmText', { provider: 'PROVIDER_PLACEHOLDER' });
                const [before, after] = text.split('PROVIDER_PLACEHOLDER');
                return <>{before}<strong className="font-semibold text-black">{selectedSubscription.provider_name}</strong>{after}</>;
              })()}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {tSub('delete')}
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {tSub('cancel')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
