import { supabase } from "@/lib/supabaseClient";
import { Subscription, SubscriptionData, SubscriptionSummary } from "@/models/subscription";

/**
 * Fetches all subscriptions for the current user with optional sorting
 */
export async function fetchSubscriptions(
  userId: string,
  sortDirection: "asc" | "desc" = "asc"
): Promise<{ data: Subscription[] | null; error: any }> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("next_payment_date", { ascending: sortDirection === "asc" });

  return { data, error };
}

/**
 * Fetches a subscription summary for the current user
 */
export async function fetchSubscriptionSummary(
  userId: string
): Promise<{ data: SubscriptionSummary | null; error: any }> {
  const { data, error } = await supabase
    .rpc("subscription_summary", { user_id: userId });

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
): Promise<{ data: Subscription | null; error: any }> {
  // Format the date to ISO string with timezone handling
  const nextPaymentDate = new Date(data.next_payment_date);
  nextPaymentDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

  const newSubscription = {
    provider_name: data.provider_name,
    amount: data.amount,
    currency: data.currency,
    frequency: data.frequency,
    next_payment_date: nextPaymentDate.toISOString().split('T')[0], // YYYY-MM-DD format
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
): Promise<{ data: Subscription | null; error: any }> {
  if (!data.id) {
    return { data: null, error: "Subscription ID is required for update" };
  }

  // Format the date to ISO string with timezone handling
  const nextPaymentDate = new Date(data.next_payment_date);
  nextPaymentDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

  const updatedSubscription = {
    provider_name: data.provider_name,
    amount: data.amount,
    currency: data.currency,
    frequency: data.frequency,
    next_payment_date: nextPaymentDate.toISOString().split('T')[0], // YYYY-MM-DD format
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
): Promise<{ success: boolean; error: any }> {
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
export async function fetchExchangeRates(): Promise<{ data: any | null; error: any }> {
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
  rates: any[]
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Handle conversions to IDR
  if (toCurrency === "IDR") {
    const rate = rates.find((r) => r.base_currency === fromCurrency);
    if (rate) {
      return amount * rate.rate;
    }
  }

  // Handle conversions from IDR
  if (fromCurrency === "IDR") {
    const rate = rates.find((r) => r.base_currency === toCurrency);
    if (rate) {
      return amount / rate.rate;
    }
  }

  // Handle conversions between non-IDR currencies
  // First convert from the source currency to IDR, then from IDR to the target currency
  const sourceRate = rates.find((r) => r.base_currency === fromCurrency);
  const targetRate = rates.find((r) => r.base_currency === toCurrency);
  
  if (sourceRate && targetRate) {
    // Convert to IDR first, then to the target currency
    const amountInIDR = amount * sourceRate.rate;
    return amountInIDR / targetRate.rate;
  }

  // If no rate found, return the original amount
  return amount;
}
