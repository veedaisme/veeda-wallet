import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Subscription, ProjectedSubscription } from '@/models/subscription';
import { Modal } from "@/components/ui/modal";
import { SubscriptionCard } from '@/components/subscription-card';
import { Switch } from '@/components/ui/switch';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
  loading: boolean;
  onBack: () => void;
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({
  subscriptions,
  onEdit,
  onDelete,
  loading,
  onBack
}) => {
  const tSub = useTranslations('subscriptions');
  
  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);

  return (
    <>
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex items-center">
          <button 
            onClick={onBack}
            className="mr-3 p-1 rounded-full hover:bg-gray-100"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">{tSub('manageSubscriptions')}</h1>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{tSub('noSubscriptions')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => {
                // Convert Subscription to ProjectedSubscription format for SubscriptionCard
                const projectedSubscription: ProjectedSubscription = {
                  id: subscription.id,
                  provider_name: subscription.provider_name,
                  original_amount: subscription.amount,
                  original_currency: subscription.currency,
                  amount_in_idr: subscription.currency === 'IDR' 
                    ? subscription.amount 
                    : subscription.amount * 15000, // Approximate conversion as fallback
                  frequency: subscription.frequency,
                  original_payment_date: subscription.payment_date,
                  projected_payment_date: subscription.payment_date,
                  user_id: '',
                  created_at: subscription.created_at,
                  updated_at: subscription.updated_at
                };
                
                return (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={projectedSubscription}
                    showInIDR={true}
                    onEdit={() => onEdit(subscription)}
                    onDelete={() => {
                      setSubscriptionToDelete(subscription);
                      setIsDeleteModalOpen(true);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
        
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={tSub('confirmDelete')}
      >
        <div className="p-4">
          {subscriptionToDelete && (
            <>
              <p className="mb-4">
                {(() => {
                  const text = tSub('deleteConfirmText', { provider: 'PROVIDER_PLACEHOLDER' });
                  const [before, after] = text.split('PROVIDER_PLACEHOLDER');
                  return (
                    <>
                      {before}
                      <strong className="font-semibold text-black">
                        {subscriptionToDelete.provider_name}
                      </strong>
                      {after}
                    </>
                  );
                })()}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    if (subscriptionToDelete) {
                      onDelete(subscriptionToDelete);
                      setIsDeleteModalOpen(false);
                      setSubscriptionToDelete(null);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {tSub('delete')}
                </button>
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSubscriptionToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {tSub('cancel')}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default SubscriptionList;
