/**
 * API Client for Backend Server
 * This will be used to replace direct Supabase calls during migration
 */

import {
  Transaction,
  TransactionCreateData,
  TransactionUpdateData,
  TransactionListParams,
  TransactionListResponse
} from '@/models/transaction';
import {
  Subscription,
  SubscriptionCreateData,
  SubscriptionUpdateData,
  SubscriptionSummary,
  ProjectedSubscription,
  ConsolidatedSubscriptionData,
  ExchangeRate
} from '@/models/subscription';
import { DashboardSummary, ChartDataResponse } from '@/types/dashboard';

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { 
      ...options, 
      headers 
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async verifyToken(token: string): Promise<{ user: any; valid: boolean }> {
    return this.request('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Transactions
  async getTransactions(params: TransactionListParams): Promise<TransactionListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && key === 'filters') {
          Object.entries(value).forEach(([filterKey, filterValue]) => {
            if (filterValue !== undefined && filterValue !== null) {
              queryParams.append(filterKey, String(filterValue));
            }
          });
        } else {
          queryParams.append(key, String(value));
        }
      }
    });

    return this.request(`/api/transactions?${queryParams.toString()}`);
  }

  async createTransaction(data: TransactionCreateData): Promise<Transaction> {
    return this.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransaction(id: string): Promise<Transaction> {
    return this.request(`/api/transactions/${id}`);
  }

  async updateTransaction(id: string, data: TransactionUpdateData): Promise<Transaction> {
    return this.request(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: string): Promise<{ message: string }> {
    return this.request(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Subscriptions
  async getSubscriptions(sortDirection: 'asc' | 'desc' = 'asc'): Promise<{ data: Subscription[] }> {
    return this.request(`/api/subscriptions?sortDirection=${sortDirection}`);
  }

  async createSubscription(data: SubscriptionCreateData): Promise<{ data: Subscription }> {
    return this.request('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubscription(id: string, data: SubscriptionUpdateData): Promise<{ data: Subscription }> {
    return this.request(`/api/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubscription(id: string): Promise<{ message: string }> {
    return this.request(`/api/subscriptions/${id}`, {
      method: 'DELETE',
    });
  }

  async getSubscriptionSummary(): Promise<{ data: SubscriptionSummary }> {
    return this.request('/api/subscriptions/summary');
  }

  async getProjectedSubscriptions(projectionEndDate: string): Promise<{ data: ProjectedSubscription[] }> {
    return this.request(`/api/subscriptions/projected?projectionEndDate=${projectionEndDate}`);
  }

  async getConsolidatedSubscriptionData(projectionEndDate?: string): Promise<{ data: ConsolidatedSubscriptionData }> {
    const params = projectionEndDate ? `?projectionEndDate=${projectionEndDate}` : '';
    return this.request(`/api/subscriptions/consolidated${params}`);
  }

  async getExchangeRates(): Promise<{ data: ExchangeRate[] }> {
    return this.request('/api/subscriptions/exchange-rates');
  }

  // Dashboard
  async getDashboardSummary(): Promise<{ data: DashboardSummary }> {
    return this.request('/api/dashboard/summary');
  }

  async getWeeklyChart(start: string, end: string): Promise<{ data: ChartDataResponse }> {
    return this.request(`/api/dashboard/charts/weekly?start=${start}&end=${end}`);
  }

  async getMonthlyChart(start: string, end: string): Promise<{ data: ChartDataResponse }> {
    return this.request(`/api/dashboard/charts/monthly?start=${start}&end=${end}`);
  }

  async getDailyChart(start: string, end: string): Promise<{ data: ChartDataResponse }> {
    return this.request(`/api/dashboard/charts/daily?start=${start}&end=${end}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

// Configuration
const API_CONFIG = {
  USE_BACKEND_API: process.env.NEXT_PUBLIC_USE_BACKEND_API === 'true',
  BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://veeda-wallet-backend.your-subdomain.workers.dev',
};

// Singleton instance
export const apiClient = new ApiClient(API_CONFIG.BACKEND_API_URL);

// Helper function to check if backend API should be used
export function shouldUseBackendAPI(): boolean {
  return API_CONFIG.USE_BACKEND_API;
}

export { API_CONFIG };
