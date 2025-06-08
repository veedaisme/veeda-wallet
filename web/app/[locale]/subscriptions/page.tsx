"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Subscription, ProjectedSubscription, SubscriptionData } from '@/models/subscription';
import { SubscriptionCard } from '@/components/subscription-card';
import { Modal } from '@/components/ui/modal';
import { SubscriptionForm } from '@/components/subscription-form';
import { useUser } from '@/hooks/useUser';
import { useAppStore } from '@/stores/appStore';
import {
  useSubscriptions,
  useAddSubscription,
  useUpdateSubscription,
  useDeleteSubscription
} from '@/hooks/queries/useSubscriptionsQuery';
import { SubscriptionPageSkeleton } from '@/components/ui/skeletons';

export default function SubscriptionsPage() {
  const tSub = useTranslations('subscriptions');
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTab = searchParams.get('from');
  const { user } = useUser();

  // UI state from Zustand store
  const {
    isSubscriptionModalOpen,
    editingSubscriptionData,
    isDeleteSubscriptionModalOpen,
    subscriptionToDelete,
    setSubscriptionModalOpen,
    setEditingSubscriptionData,
    openEditSubscriptionModal,
    openDeleteSubscriptionModal,
    closeSubscriptionModal,
    closeDeleteSubscriptionModal,
  } = useAppStore();

  // React Query hooks
  const {
    data: subscriptions = [],
    isLoading,
    isError,
    error,
  } = useSubscriptions(user?.id);

  const addSubscriptionMutation = useAddSubscription();
  const updateSubscriptionMutation = useUpdateSubscription();
  const deleteSubscriptionMutation = useDeleteSubscription();

  // Redirect to auth if no user
  React.useEffect(() => {
    if (!user?.id) {
      router.push('/auth');
    }
  }, [user, router]);

  // Handle saving subscription
  const handleSaveSubscription = async (data: SubscriptionData) => {
    if (!user?.id) return;

    try {
      if (data.id) {
        await updateSubscriptionMutation.mutateAsync({
          subscriptionData: data,
          userId: user.id,
        });
      } else {
        await addSubscriptionMutation.mutateAsync({
          subscriptionData: data,
          userId: user.id,
        });
      }

      closeSubscriptionModal();
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  // Handle deleting subscription
  const handleDeleteSubscription = async () => {
    if (!user?.id || !subscriptionToDelete) return;

    try {
      await deleteSubscriptionMutation.mutateAsync({
        subscriptionId: subscriptionToDelete.id,
        userId: user.id,
      });

      closeDeleteSubscriptionModal();
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  // Loading state for mutations
  const isMutating = addSubscriptionMutation.isPending ||
                    updateSubscriptionMutation.isPending ||
                    deleteSubscriptionMutation.isPending;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex items-center z-10">
        <button
          onClick={() => {
            // Navigate back to the correct tab if specified
            if (fromTab === 'subscriptions') {
              // Use replace to avoid adding to history stack and ensure clean URL
              router.replace('/?tab=subscriptions');
            } else {
              router.back();
            }
          }}
          className="mr-3 p-1 rounded-full hover:bg-gray-100"
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold">{tSub('manageSubscriptions')}</h1>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {isLoading && subscriptions.length === 0 ? (
          <SubscriptionPageSkeleton />
        ) : isError ? (
          <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
            {error?.message || 'An error occurred while loading subscriptions'}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{tSub('noSubscriptions')}</p>
            <button
              onClick={() => {
                setEditingSubscriptionData(null);
                setSubscriptionModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              {tSub('addYourFirst')}
            </button>
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
                user_id: user?.id || '',
                created_at: subscription.created_at,
                updated_at: subscription.updated_at
              };
              
              return (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={projectedSubscription}
                  showInIDR={true}
                  onEdit={() => openEditSubscriptionModal(subscription)}
                  onDelete={() => openDeleteSubscriptionModal(subscription)}
                />
              );
            })}
          </div>
        )}
        
        {/* Add/Edit Floating Action Button */}
        <button
          onClick={() => {
            setEditingSubscriptionData(null);
            setSubscriptionModalOpen(true);
          }}
          className="fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label={tSub('addSubscription')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      {/* Add/Edit Subscription Modal */}
      <Modal
        isOpen={isSubscriptionModalOpen}
        onClose={closeSubscriptionModal}
        title={editingSubscriptionData ? tSub('editSubscription') : tSub('addSubscription')}
      >
        <SubscriptionForm
          initialData={editingSubscriptionData || undefined}
          onSubmit={handleSaveSubscription}
          onCancel={closeSubscriptionModal}
          loading={isMutating}
        />
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteSubscriptionModalOpen}
        onClose={closeDeleteSubscriptionModal}
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
                  onClick={handleDeleteSubscription}
                  disabled={isMutating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteSubscriptionMutation.isPending ? 'Deleting...' : tSub('delete')}
                </button>
                <button
                  onClick={closeDeleteSubscriptionModal}
                  disabled={isMutating}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tSub('cancel')}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
