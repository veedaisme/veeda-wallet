import { supabase } from "@/lib/supabaseClient";
import {
  Subscription,
  SubscriptionData,
  SubscriptionSummary,
  ProjectedSubscription,
  ExchangeRate
} from "@/models/subscription";

/**
 * Fetches all subscriptions for the current user with optional sorting
 */
export async function fetchSubscriptions(
  userId: string,
  sortDirection: "asc" | "desc" = "asc"
): Promise<{ data: Subscription[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("payment_date", { ascending: sortDirection === "asc" });

  return { data, error };
}

/**
 * Fetches a subscription summary for the current user
 */
export async function fetchSubscriptionSummary(
  userId: string
): Promise<{ data: SubscriptionSummary | null; error: Error | null }> {
  const { data, error } = await supabase
    .rpc("subscription_summary", { p_user_id: userId });

  return { 
    data: data && data[0] ? data[0] : null, 
    error 
  };
}

/**
 * Adds a new subscription
 */
export async function addSubscription(
  data: SubscriptionData,
  userId: string
): Promise<{ data: Subscription | null; error: Error | null }> {
  // Format the date to ISO string with timezone handling
  const paymentDate = new Date(data.payment_date);
  paymentDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

  const newSubscription = {
    provider_name: data.provider_name,
    amount: data.amount,
    currency: data.currency,
    frequency: data.frequency,
    payment_date: paymentDate.toISOString().split('T')[0], // YYYY-MM-DD format
    user_id: userId,
  };

  const { data: inserted, error } = await supabase
    .from("subscriptions")
    .insert([newSubscription])
    .select()
    .single();

  return { data: inserted, error };
}

/**
 * Updates an existing subscription
 */
export async function updateSubscription(
  data: SubscriptionData,
  userId: string
): Promise<{ data: Subscription | null; error: string | Error | null }> {
  if (!data.id) {
    return { data: null, error: "Subscription ID is required for update" };
  }

  // Format the date to ISO string with timezone handling
  const paymentDate = new Date(data.payment_date);
  paymentDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

  const updatedSubscription = {
    provider_name: data.provider_name,
    amount: data.amount,
    currency: data.currency,
    frequency: data.frequency,
    payment_date: paymentDate.toISOString().split('T')[0], // YYYY-MM-DD format
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from("subscriptions")
    .update(updatedSubscription)
    .eq("id", data.id)
    .eq("user_id", userId) // Extra safety check
    .select()
    .single();

  return { data: updated, error };
}

/**
 * Deletes a subscription
 */
export async function deleteSubscription(
  id: string,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId); // Extra safety check

  return { success: !error, error };
}

/**
 * Fetches currency exchange rates
 */
export async function fetchExchangeRates(): Promise<{ data: ExchangeRate[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("currency_exchange_rates")
    .select("*")
    .eq("target_currency", "IDR");

  return { data, error };
}

/**
 * Converts an amount from one currency to another using stored exchange rates
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRate[]
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Handle conversions to IDR
  if (toCurrency === "IDR") {
    const rate = rates.find((r) => r.base_currency === fromCurrency);
    if (rate) {
      return amount * parseFloat(rate.rate); // Assuming rate.rate is a string that needs parsing
    }
  }

  // Handle conversions from IDR
  if (fromCurrency === "IDR") {
    const rate = rates.find((r) => r.base_currency === toCurrency);
    if (rate) {
      return amount / parseFloat(rate.rate); // Assuming rate.rate is a string that needs parsing
    }
  }

  // Handle conversions between non-IDR currencies
  // First convert from the source currency to IDR, then from IDR to the target currency
  const sourceRate = rates.find((r) => r.base_currency === fromCurrency);
  const targetRate = rates.find((r) => r.base_currency === toCurrency);
  
  if (sourceRate && targetRate) {
    // Convert to IDR first, then to the target currency
    const amountInIDR = amount * parseFloat(sourceRate.rate); // Assuming rate.rate is a string
    return amountInIDR / parseFloat(targetRate.rate); // Assuming rate.rate is a string
  }

  // If no rate found, return the original amount
  return amount;
}

/**
 * Fetches projected subscriptions for the current user
 */
export async function fetchProjectedSubscriptions(
  userId: string,
  projectionEndDate: string // Expected format: 'YYYY-MM-DD'
): Promise<{ data: ProjectedSubscription[] | null; error: Error | null }> {
  if (!userId) {
    return { data: null, error: new Error("User ID is required") }; // Return an Error object
  }
  if (!projectionEndDate) {
    return { data: null, error: new Error("Projection end date is required") }; // Return an Error object
  }

  const { data, error } = await supabase.rpc("get_projected_subscription_payments", {
    p_user_id: userId,
    p_projection_end_date: projectionEndDate,
  });

  if (error) {
    console.error("Error fetching projected subscriptions:", error);
    return { data: null, error };
  }
  
  return { data: data as ProjectedSubscription[] | null, error: null };
}

/**
 * Fetches consolidated subscription data in a single call
 * This combines regular subscriptions, projected subscriptions, and summary in one API call
 */
export async function fetchConsolidatedSubscriptionData(
  userId: string,
  projectionEndDate?: string // Optional - format: 'YYYY-MM-DD'
): Promise<{ 
  data: { 
    subscriptions: Subscription[] | null;
    projected_subscriptions: ProjectedSubscription[] | null;
    subscription_summary: SubscriptionSummary | null;
  } | null; 
  error: Error | null 
}> {
  if (!userId) {
    return { data: null, error: new Error("User ID is required") };
  }

  const params: Record<string, string> = {
    p_user_id: userId
  };

  // Add projection end date if provided
  if (projectionEndDate) {
    params.p_projection_end_date = projectionEndDate;
  }

  const { data, error } = await supabase.rpc(
    "get_consolidated_subscription_data",
    params
  );

  if (error) {
    console.error("Error fetching consolidated subscription data:", error);
    return { data: null, error };
  }
  
  return { 
    data: data as {
      subscriptions: Subscription[] | null;
      projected_subscriptions: ProjectedSubscription[] | null;
      subscription_summary: SubscriptionSummary | null;
    } | null, 
    error: null 
  };
}
