import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { SubscriptionsList } from "@/components/subscriptions-list";
import { Modal } from "@/components/ui/modal";
import { SubscriptionForm } from '@/components/subscription-form';
import { SubscriptionData, SubscriptionSummary, ProjectedSubscription } from "@/models/subscription";
import {
  addSubscription,
  updateSubscription,
  deleteSubscription,
  fetchProjectedSubscriptions,
  fetchSubscriptionSummary
} from '@/lib/subscriptionService';

interface SubscriptionsViewProps {
  userId: string | null;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ userId }) => {
  const tSub = useTranslations('subscriptions');
  
  const [subscriptions, setSubscriptions] = useState<ProjectedSubscription[]>([]);
  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionSummary | null>(null);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [isAddSubscriptionModalOpen, setIsAddSubscriptionModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use useCallback to prevent the function from being recreated on every render
  const loadProjectedSubscriptions = useCallback(async () => {
    if (!userId) return;
    setLoadingSubscriptions(true);
    setError(null);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12); // Project 12 months into the future
    const projectionEndDateStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const { data: projectedSubs, error: projectedSubsError } = await fetchProjectedSubscriptions(userId, projectionEndDateStr);
      if (projectedSubsError) throw projectedSubsError;
      setSubscriptions(projectedSubs ?? []);

      const { data, error } = await fetchSubscriptionSummary(userId);
      if (error) {
        console.error("Error fetching subscription summary:", error);
        setSubscriptionSummary(null);
      } else {
        console.log("Subscription summary data:", data);
        setSubscriptionSummary(data);
      }

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
      loadProjectedSubscriptions();
    }
  }, [userId, loadProjectedSubscriptions]);

  const handleSaveSubscription = async (data: SubscriptionData) => {
    if (!userId) return;
    try {
      setLoadingSubscriptions(true);
      if (data.id) {
        await updateSubscription(data, userId);
      } else {
        await addSubscription(data, userId);
      }
      loadProjectedSubscriptions();
      setIsAddSubscriptionModalOpen(false);
    } catch (error) {
      console.error('Error saving subscription:', error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleConfirmDeleteSubscription = async (subscription: ProjectedSubscription) => {
    if (!userId || !subscription) return;
    try {
      setLoadingSubscriptions(true);
      await deleteSubscription(subscription.id, userId);
      setSubscriptions(prev => prev.filter(s => s.id !== subscription.id));
      // Re-fetch summary after deleting
      const { data: summaryData, error: summaryError } = await fetchSubscriptionSummary(userId);
      if (summaryError) throw summaryError;
      setSubscriptionSummary(summaryData);
    } catch (error) {
      console.error("Error deleting subscription:", error);
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">{tSub('activeSubscriptions')}</div>
              <div className="text-2xl font-bold">{subscriptionSummary.subscription_count}</div>
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
          <SubscriptionsList 
            subscriptions={subscriptions} 
            summary={subscriptionSummary}
            onDelete={handleConfirmDeleteSubscription}
            onUpdate={handleSaveSubscription}
            loading={loadingSubscriptions}
            openAddSubscriptionModal={() => setIsAddSubscriptionModalOpen(true)}
          />
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p>{tSub('noUpcomingPayments')}</p>
          </div>
        )}
      </div>
      
      {/* Add Subscription Modal */}
      <Modal
        isOpen={isAddSubscriptionModalOpen}
        onClose={() => setIsAddSubscriptionModalOpen(false)}
        title={tSub('addSubscription')}
      >
        <SubscriptionForm
          onSubmit={handleSaveSubscription}
          onCancel={() => setIsAddSubscriptionModalOpen(false)}
          loading={loadingSubscriptions}
        />
      </Modal>
    </div>
  );
};

export default SubscriptionsView;