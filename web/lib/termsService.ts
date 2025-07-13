import { supabaseClient } from './supabaseClient';

export interface TermsAcceptance {
  id: string;
  user_id: string;
  terms_version: string;
  accepted_at: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface TermsStatus {
  hasAcceptedCurrent: boolean;
  acceptedVersions: string[];
  latestAcceptance?: TermsAcceptance;
}

export class TermsService {
  /**
   * Accept terms and conditions for a user
   */
  static async acceptTerms(
    userId: string, 
    version: string = '1.0',
    userAgent?: string
  ): Promise<TermsAcceptance> {
    const { data, error } = await supabaseClient
      .from('user_terms_acceptance')
      .insert({
        user_id: userId,
        terms_version: version,
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to accept terms: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Get user's terms acceptance status
   */
  static async getUserTermsStatus(userId: string): Promise<TermsStatus> {
    const { data, error } = await supabaseClient
      .from('user_terms_acceptance')
      .select('*')
      .eq('user_id', userId)
      .order('accepted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch terms status: ${error.message}`);
    }

    const currentVersion = '1.0'; // This could be fetched from config
    const hasAcceptedCurrent = data.some(acc => acc.terms_version === currentVersion);
    
    return {
      hasAcceptedCurrent,
      acceptedVersions: data.map(acc => acc.terms_version),
      latestAcceptance: data[0] || undefined
    };
  }

  /**
   * Check if user has accepted a specific version
   */
  static async hasUserAcceptedVersion(
    userId: string, 
    version: string
  ): Promise<boolean> {
    const { data, error } = await supabaseClient
      .from('user_terms_acceptance')
      .select('id')
      .eq('user_id', userId)
      .eq('terms_version', version)
      .limit(1);

    if (error) {
      throw new Error(`Failed to check terms acceptance: ${error.message}`);
    }
    
    return data.length > 0;
  }

  /**
   * Get current terms version
   */
  static getCurrentVersion(): string {
    return '1.0';
  }
}