export const CURRENT_TERMS_VERSION = '1.0';

export interface TermsSection {
  title: string;
  content: string;
}

export interface TermsContent {
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: Record<string, TermsSection>;
}

export const TERMS_CONTENT: TermsContent = {
  version: CURRENT_TERMS_VERSION,
  effectiveDate: '2025-07-12',
  lastUpdated: '2025-07-12',
  sections: {
    introduction: {
      title: 'Introduction',
      content: `Welcome to Veeda Wallet (formerly known as Clair). These Terms and Conditions ("Terms") govern your use of our mobile application and web platform (collectively, the "Service") operated by Veeda Wallet ("we", "us", or "our").

By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.`
    },
    
    acceptance: {
      title: 'Acceptance of Terms',
      content: `By creating an account or using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. You must be at least 18 years old to use this Service.`
    },

    serviceDescription: {
      title: 'Service Description',
      content: `Veeda Wallet is a personal finance tracking application that provides:
• Manual tracking of your expenses and income transactions
• Management of subscription services and payment schedules
• Basic spending analytics and historical comparisons
• Multi-currency support for international transactions
• Secure data storage with user authentication

TECHNICAL INFRASTRUCTURE:
• Service hosted on Vercel platform with enterprise-grade security
• Data storage and authentication powered by Supabase
• All data encrypted with 256-bit encryption standards
• Service available globally via web browser

IMPORTANT DISCLAIMERS:
• Veeda Wallet is a financial tracking tool, not a financial advisor
• We do not provide investment advice, tax advice, or financial planning services
• All financial decisions are your responsibility
• Please verify all calculations and data with your actual bank and financial statements
• We are not liable for any financial decisions made based on data in our app

The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue the Service at any time. We may add, change, or remove features without prior notice.`
    },

    userAccounts: {
      title: 'User Accounts',
      content: `To use certain features of our Service, you must create an account. You are responsible for:
• Maintaining the confidentiality of your account credentials
• All activities that occur under your account
• Providing accurate and complete information
• Keeping your account information updated

You may not share your account with others or use another person's account without permission.`
    },

    dataCollection: {
      title: 'Data Collection and Privacy',
      content: `We collect and process your personal information as described in our Privacy Policy. By using our Service, you consent to:
• Collection of financial transaction data you input
• Storage of your personal preferences and settings
• Processing of usage analytics to improve our Service
• Communication with you regarding your account and our Service

IMPORTANT DATA PROTECTION COMMITMENTS:
• We do NOT sell, rent, or share your personal financial data with third parties for marketing purposes
• All financial data is encrypted using 256-bit encryption standards
• Your transaction data is stored securely and processed locally when possible
• We implement bank-level security measures to protect your information
• You have the right to export or permanently delete all your data at any time

While we implement robust security measures, no system is completely secure, and you should use strong passwords and enable two-factor authentication.`
    },

    userRights: {
      title: 'Your Rights and Responsibilities',
      content: `You have the right to:
• Access and export your data
• Delete your account and associated data
• Modify your privacy settings
• Receive notifications about changes to these Terms

You are responsible for:
• Using the Service in compliance with applicable laws
• Not attempting to compromise the security of our Service
• Not using the Service for any illegal or unauthorized purpose
• Respecting the intellectual property rights of others`
    },

    intellectualProperty: {
      title: 'Intellectual Property',
      content: `The Service and its original content, features, and functionality are owned by Veeda Wallet and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.

You may not modify, copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell any information or content obtained from the Service.`
    },

    limitation: {
      title: 'Limitation of Liability',
      content: `To the maximum extent permitted by law, Veeda Wallet shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.

Our total liability shall not exceed the amount you paid to us in the 12 months preceding the claim.`
    },

    termination: {
      title: 'Termination and Data Retention',
      content: `We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.

DATA RETENTION AND DELETION:
• Upon account termination by you, we will delete your personal and financial data within 30 days
• You can request immediate data deletion by contacting support@veedawallet.com
• Some anonymized usage data may be retained for service improvement purposes
• Financial transaction data will be permanently deleted and cannot be recovered after deletion
• You can export all your data before termination through your account settings

Upon termination, your right to use the Service will cease immediately.`
    },

    changes: {
      title: 'Changes to Terms',
      content: `We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.

Continued use of the Service after changes constitutes acceptance of the new Terms.`
    },

    thirdPartyServices: {
      title: 'Third-Party Services',
      content: `Our Service currently integrates with the following third-party services:
• Vercel (hosting and deployment platform)
• Supabase (database and authentication services)

If we integrate additional third-party services in the future, you may be subject to additional terms of service from those providers. We will notify you of any such additional terms before you use the relevant features.

We are not responsible for the availability, accuracy, or content of third-party services.`
    },

    contact: {
      title: 'Contact Information',
      content: `If you have any questions about these Terms and Conditions, please contact us at:

Email: support@veedawallet.com
Website: https://veedawallet.com

These Terms and Conditions are effective as of 2025-07-13.`
    }
  }
};

export const getTermsContent = (): TermsContent => TERMS_CONTENT;

export const getTermsVersion = (): string => CURRENT_TERMS_VERSION;

export const getTermsSectionKeys = (): string[] => Object.keys(TERMS_CONTENT.sections);