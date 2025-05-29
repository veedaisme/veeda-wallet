import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { SubscriptionScheduleList } from "@/components/subscriptionScheduleList";
import { Modal } from "@/components/ui/modal";
import { SubscriptionForm } from '@/components/subscription-form';
import { SubscriptionData, SubscriptionSummary, ProjectedSubscription, Subscription } from "@/models/subscription";
import {
  addSubscription,
  updateSubscription,
  fetchConsolidatedSubscriptionData
} from '@/lib/subscriptionService';

interface SubscriptionsViewProps {
  userId: string | null;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ userId }) => {
  const tSub = useTranslations('subscriptions');
  const router = useRouter();
  
  const [projectedSubscriptions, setProjectedSubscriptions] = useState<ProjectedSubscription[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionSummary | null>(null);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [isAddSubscriptionModalOpen, setIsAddSubscriptionModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use useCallback to prevent the function from being recreated on every render
  const loadSubscriptionData = useCallback(async () => {
    if (!userId) return;
    setLoadingSubscriptions(true);
    setError(null);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12); // Project 12 months into the future
    const projectionEndDateStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // Fetch all subscription data in a single API call
      const { data, error } = await fetchConsolidatedSubscriptionData(userId, projectionEndDateStr);
      
      if (error) throw error;
      if (!data) throw new Error("No data returned from server");
      
      // Update all state from the consolidated data
      setSubscriptions(data.subscriptions ?? []);
      setProjectedSubscriptions(data.projected_subscriptions ?? []);
      setSubscriptionSummary(data.subscription_summary);

    } catch (e: unknown) {
      console.error("Failed to load subscription data:", e);
      if (e instanceof Error) {
        setError(e.message || "Failed to load subscription data");
      } else {
        setError("An unknown error occurred while loading subscription data");
      }
    } finally {
      setLoadingSubscriptions(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadSubscriptionData();
    }
  }, [userId, loadSubscriptionData]);

  const handleSaveSubscription = async (data: SubscriptionData) => {
    if (!userId) return;
    try {
      setLoadingSubscriptions(true);
      if (data.id) {
        await updateSubscription(data, userId);
      } else {
        await addSubscription(data, userId);
      }
      loadSubscriptionData();
      setIsAddSubscriptionModalOpen(false);
    } catch (error) {
      console.error('Error saving subscription:', error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Summary Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">{tSub('title')}</h2>
        
        {loadingSubscriptions && !subscriptionSummary ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
            {error}
          </div>
        ) : subscriptionSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">{tSub('monthlySpending')}</div>
              <div className="text-2xl font-bold">Rp {subscriptionSummary.total_monthly_recurring.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">{tSub('yearlySpending')}</div>
              <div className="text-2xl font-bold">Rp {(subscriptionSummary.total_monthly_recurring * 12).toLocaleString()}</div>
            </div>
            <div 
              className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => router.push('/subscriptions?from=subscriptions')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500">{tSub('activeSubscriptions')}</div>
                  <div className="text-2xl font-bold">{subscriptionSummary.subscription_count}</div>
                </div>
                <div className="text-gray-400 flex items-center">
                  <span className="text-xs mr-1">{tSub('viewAll')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p>{tSub('noSubscriptionsYet')}</p>
          </div>
        )}
      </div>
      
      {/* Subscriptions List */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">{tSub('upcomingPayments')}</h3>
        
        {loadingSubscriptions && subscriptions.length === 0 ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : subscriptions.length > 0 ? (
          <SubscriptionScheduleList 
            subscriptions={projectedSubscriptions} 
            summary={subscriptionSummary}
            openAddSubscriptionModal={() => setIsAddSubscriptionModalOpen(true)}
          />
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p>{tSub('noUpcomingPayments')}</p>
          </div>
        )}
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
          loading={loadingSubscriptions}
        />
      </Modal>


    </div>
  );
};

export default SubscriptionsView;