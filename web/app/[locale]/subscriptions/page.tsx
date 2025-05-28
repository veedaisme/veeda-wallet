"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Subscription, ProjectedSubscription, SubscriptionData } from '@/models/subscription';
import { SubscriptionCard } from '@/components/subscription-card';
import { Modal } from '@/components/ui/modal';
import { SubscriptionForm } from '@/components/subscription-form';
import { useUser } from '@/hooks/useUser';
import {
  fetchSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription
} from '@/lib/subscriptionService';

export default function SubscriptionsPage() {
  const tSub = useTranslations('subscriptions');
  const router = useRouter();
  const { user } = useUser();
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddSubscriptionModalOpen, setIsAddSubscriptionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionData | null>(null);

  // Fetch subscriptions
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!user?.id) {
        router.push('/auth');
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await fetchSubscriptions(user.id);
        if (error) throw error;
        setSubscriptions(data || []);
      } catch (e) {
        console.error('Failed to load subscriptions:', e);
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred while loading subscriptions');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadSubscriptions();
  }, [user, router]);

  // Handle saving subscription
  const handleSaveSubscription = async (data: SubscriptionData) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      if (data.id) {
        await updateSubscription(data, user.id);
      } else {
        await addSubscription(data, user.id);
      }
      
      // Refresh the list
      const { data: refreshedData } = await fetchSubscriptions(user.id);
      setSubscriptions(refreshedData || []);
      
      setIsAddSubscriptionModalOpen(false);
      setEditingSubscription(null);
    } catch (error) {
      console.error('Error saving subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting subscription
  const handleDeleteSubscription = async () => {
    if (!user?.id || !subscriptionToDelete) return;
    
    try {
      setLoading(true);
      await deleteSubscription(subscriptionToDelete.id, user.id);
      
      // Update the list
      setSubscriptions(prev => prev.filter(s => s.id !== subscriptionToDelete.id));
      setIsDeleteModalOpen(false);
      setSubscriptionToDelete(null);
    } catch (error) {
      console.error('Error deleting subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex items-center z-10">
        <button 
          onClick={() => router.back()}
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
        {loading && subscriptions.length === 0 ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
            {error}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{tSub('noSubscriptions')}</p>
            <button
              onClick={() => setIsAddSubscriptionModalOpen(true)}
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
                  onEdit={() => {
                    const subscriptionData: SubscriptionData = {
                      id: subscription.id,
                      provider_name: subscription.provider_name,
                      amount: subscription.amount,
                      currency: subscription.currency,
                      frequency: subscription.frequency,
                      payment_date: new Date(subscription.payment_date)
                    };
                    setEditingSubscription(subscriptionData);
                    setIsAddSubscriptionModalOpen(true);
                  }}
                  onDelete={() => {
                    setSubscriptionToDelete(subscription);
                    setIsDeleteModalOpen(true);
                  }}
                />
              );
            })}
          </div>
        )}
        
        {/* Add/Edit Floating Action Button */}
        <button
          onClick={() => {
            setEditingSubscription(null);
            setIsAddSubscriptionModalOpen(true);
          }}
          className="fixed bottom-6 right-6 p-4 bg-black text-white rounded-full shadow-lg hover:bg-gray-800"
          aria-label={tSub('addSubscription')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      {/* Add/Edit Subscription Modal */}
      <Modal
        isOpen={isAddSubscriptionModalOpen}
        onClose={() => {
          setIsAddSubscriptionModalOpen(false);
          setEditingSubscription(null);
        }}
        title={editingSubscription ? tSub('editSubscription') : tSub('addSubscription')}
      >
        <SubscriptionForm
          initialData={editingSubscription || undefined}
          onSubmit={handleSaveSubscription}
          onCancel={() => {
            setIsAddSubscriptionModalOpen(false);
            setEditingSubscription(null);
          }}
          loading={loading}
        />
      </Modal>
      
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
                  onClick={handleDeleteSubscription}
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
    </div>
  );
}
