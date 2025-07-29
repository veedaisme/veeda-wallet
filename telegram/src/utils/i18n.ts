// Internationalization utility for Telegram Bot
// Supports English (en) and Bahasa Indonesia (id)

export type SupportedLanguage = 'en' | 'id';

export interface TranslationStrings {
  // Common
  yes: string;
  no: string;
  cancel: string;
  confirm: string;
  help: string;
  error: string;
  success: string;
  loading: string;
  today: string;
  yesterday: string;
  thisWeek: string;
  lastWeek: string;
  thisMonth: string;
  lastMonth: string;

  // Welcome & Authentication
  welcome: string;
  welcomeBack: string;
  accountNotLinked: string;
  accountLinked: string;
  linkAccount: string;
  unlinkAccount: string;
  demoLink: string;
  accountStatus: string;

  // Transactions
  transactions: string;
  recentTransactions: string;
  addTransaction: string;
  transactionAdded: string;
  transactionFailed: string;
  transactionConfirmation: string;
  amount: string;
  category: string;
  date: string;
  note: string;
  noTransactions: string;

  // Categories
  food: string;
  transportation: string;
  entertainment: string;
  shopping: string;
  housing: string;
  utilities: string;
  health: string;
  education: string;
  travel: string;
  insurance: string;
  investment: string;
  other: string;

  // Dashboard
  dashboard: string;
  spendingSummary: string;
  insights: string;
  quickInsights: string;
  change: string;
  increase: string;
  decrease: string;
  stable: string;

  // Subscriptions
  subscriptions: string;
  activeSubscriptions: string;
  addSubscription: string;
  subscriptionAdded: string;
  subscriptionSummary: string;
  upcomingPayments: string;
  monthly: string;
  quarterly: string;
  annually: string;
  nextPayment: string;
  noSubscriptions: string;

  // Time periods
  daily: string;
  weekly: string;
  monthly: string;
  yearly: string;
  perMonth: string;
  perYear: string;

  // Actions
  show: string;
  add: string;
  edit: string;
  delete: string;
  save: string;
  update: string;
  view: string;

  // Messages
  somethingWentWrong: string;
  tryAgainLater: string;
  checkConnection: string;
  contactSupport: string;
  whatYouCanTry: string;
  tip: string;

  // Help sections
  transactionManagement: string;
  dashboardInsights: string;
  subscriptionManagement: string;
  accountManagement: string;
  naturalLanguage: string;
  gettingStarted: string;
  afterLinking: string;
  needHelp: string;

  // Confirmation messages
  areYouSure: string;
  confirmAction: string;
  actionCancelled: string;
  actionCompleted: string;

  // Financial terms
  spent: string;
  income: string;
  expense: string;
  budget: string;
  total: string;
  average: string;
  summary: string;
  analysis: string;
  recommendation: string;
  optimization: string;
}

const translations: Record<SupportedLanguage, TranslationStrings> = {
  en: {
    // Common
    yes: 'Yes',
    no: 'No',
    cancel: 'Cancel',
    confirm: 'Confirm',
    help: 'Help',
    error: 'Error',
    success: 'Success',
    loading: 'Loading',
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This week',
    lastWeek: 'Last week',
    thisMonth: 'This month',
    lastMonth: 'Last month',

    // Welcome & Authentication
    welcome: 'Welcome to Clair AI Assistant',
    welcomeBack: 'Welcome back',
    accountNotLinked: 'Account not linked',
    accountLinked: 'Account linked',
    linkAccount: 'Link account',
    unlinkAccount: 'Unlink account',
    demoLink: 'Demo link',
    accountStatus: 'Account status',

    // Transactions
    transactions: 'Transactions',
    recentTransactions: 'Recent Transactions',
    addTransaction: 'Add transaction',
    transactionAdded: 'Transaction added successfully',
    transactionFailed: 'Transaction failed',
    transactionConfirmation: 'Transaction Confirmation',
    amount: 'Amount',
    category: 'Category',
    date: 'Date',
    note: 'Note',
    noTransactions: 'No transactions found',

    // Categories
    food: 'Food',
    transportation: 'Transportation',
    entertainment: 'Entertainment',
    shopping: 'Shopping',
    housing: 'Housing',
    utilities: 'Utilities',
    health: 'Health',
    education: 'Education',
    travel: 'Travel',
    insurance: 'Insurance',
    investment: 'Investment',
    other: 'Other',

    // Dashboard
    dashboard: 'Dashboard',
    spendingSummary: 'Spending Summary',
    insights: 'Insights',
    quickInsights: 'Quick Insights',
    change: 'Change',
    increase: 'Increase',
    decrease: 'Decrease',
    stable: 'Stable',

    // Subscriptions
    subscriptions: 'Subscriptions',
    activeSubscriptions: 'Active Subscriptions',
    addSubscription: 'Add subscription',
    subscriptionAdded: 'Subscription added successfully',
    subscriptionSummary: 'Subscription Summary',
    upcomingPayments: 'Upcoming Payments',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annually: 'Annually',
    nextPayment: 'Next payment',
    noSubscriptions: 'No active subscriptions',

    // Time periods
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    perMonth: 'per month',
    perYear: 'per year',

    // Actions
    show: 'Show',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    update: 'Update',
    view: 'View',

    // Messages
    somethingWentWrong: 'Something went wrong',
    tryAgainLater: 'Please try again later',
    checkConnection: 'Check your internet connection',
    contactSupport: 'Contact support if the problem persists',
    whatYouCanTry: 'What you can try',
    tip: 'Tip',

    // Help sections
    transactionManagement: 'Transaction Management',
    dashboardInsights: 'Dashboard & Insights',
    subscriptionManagement: 'Subscription Management',
    accountManagement: 'Account Management',
    naturalLanguage: 'Natural Language',
    gettingStarted: 'Getting Started',
    afterLinking: 'What you can do after linking',
    needHelp: 'Need help?',

    // Confirmation messages
    areYouSure: 'Are you sure?',
    confirmAction: 'Please confirm this action',
    actionCancelled: 'Action cancelled',
    actionCompleted: 'Action completed successfully',

    // Financial terms
    spent: 'Spent',
    income: 'Income',
    expense: 'Expense',
    budget: 'Budget',
    total: 'Total',
    average: 'Average',
    summary: 'Summary',
    analysis: 'Analysis',
    recommendation: 'Recommendation',
    optimization: 'Optimization',
  },

  id: {
    // Common
    yes: 'Ya',
    no: 'Tidak',
    cancel: 'Batal',
    confirm: 'Konfirmasi',
    help: 'Bantuan',
    error: 'Error',
    success: 'Berhasil',
    loading: 'Memuat',
    today: 'Hari ini',
    yesterday: 'Kemarin',
    thisWeek: 'Minggu ini',
    lastWeek: 'Minggu lalu',
    thisMonth: 'Bulan ini',
    lastMonth: 'Bulan lalu',

    // Welcome & Authentication
    welcome: 'Selamat datang di Asisten AI Clair',
    welcomeBack: 'Selamat datang kembali',
    accountNotLinked: 'Akun belum terhubung',
    accountLinked: 'Akun terhubung',
    linkAccount: 'Hubungkan akun',
    unlinkAccount: 'Putuskan koneksi akun',
    demoLink: 'Link demo',
    accountStatus: 'Status akun',

    // Transactions
    transactions: 'Transaksi',
    recentTransactions: 'Transaksi Terbaru',
    addTransaction: 'Tambah transaksi',
    transactionAdded: 'Transaksi berhasil ditambahkan',
    transactionFailed: 'Transaksi gagal',
    transactionConfirmation: 'Konfirmasi Transaksi',
    amount: 'Jumlah',
    category: 'Kategori',
    date: 'Tanggal',
    note: 'Catatan',
    noTransactions: 'Tidak ada transaksi',

    // Categories
    food: 'Makanan',
    transportation: 'Transportasi',
    entertainment: 'Hiburan',
    shopping: 'Belanja',
    housing: 'Rumah',
    utilities: 'Utilitas',
    health: 'Kesehatan',
    education: 'Pendidikan',
    travel: 'Perjalanan',
    insurance: 'Asuransi',
    investment: 'Investasi',
    other: 'Lainnya',

    // Dashboard
    dashboard: 'Dashboard',
    spendingSummary: 'Ringkasan Pengeluaran',
    insights: 'Wawasan',
    quickInsights: 'Wawasan Cepat',
    change: 'Perubahan',
    increase: 'Naik',
    decrease: 'Turun',
    stable: 'Stabil',

    // Subscriptions
    subscriptions: 'Langganan',
    activeSubscriptions: 'Langganan Aktif',
    addSubscription: 'Tambah langganan',
    subscriptionAdded: 'Langganan berhasil ditambahkan',
    subscriptionSummary: 'Ringkasan Langganan',
    upcomingPayments: 'Pembayaran Mendatang',
    monthly: 'Bulanan',
    quarterly: 'Triwulan',
    annually: 'Tahunan',
    nextPayment: 'Pembayaran berikutnya',
    noSubscriptions: 'Tidak ada langganan aktif',

    // Time periods
    daily: 'Harian',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    yearly: 'Tahunan',
    perMonth: 'per bulan',
    perYear: 'per tahun',

    // Actions
    show: 'Tampilkan',
    add: 'Tambah',
    edit: 'Edit',
    delete: 'Hapus',
    save: 'Simpan',
    update: 'Perbarui',
    view: 'Lihat',

    // Messages
    somethingWentWrong: 'Terjadi kesalahan',
    tryAgainLater: 'Silakan coba lagi nanti',
    checkConnection: 'Periksa koneksi internet Anda',
    contactSupport: 'Hubungi dukungan jika masalah berlanjut',
    whatYouCanTry: 'Yang bisa Anda coba',
    tip: 'Tips',

    // Help sections
    transactionManagement: 'Manajemen Transaksi',
    dashboardInsights: 'Dashboard & Wawasan',
    subscriptionManagement: 'Manajemen Langganan',
    accountManagement: 'Manajemen Akun',
    naturalLanguage: 'Bahasa Natural',
    gettingStarted: 'Memulai',
    afterLinking: 'Yang bisa Anda lakukan setelah menghubungkan',
    needHelp: 'Butuh bantuan?',

    // Confirmation messages
    areYouSure: 'Apakah Anda yakin?',
    confirmAction: 'Silakan konfirmasi tindakan ini',
    actionCancelled: 'Tindakan dibatalkan',
    actionCompleted: 'Tindakan berhasil diselesaikan',

    // Financial terms
    spent: 'Dihabiskan',
    income: 'Pemasukan',
    expense: 'Pengeluaran',
    budget: 'Anggaran',
    total: 'Total',
    average: 'Rata-rata',
    summary: 'Ringkasan',
    analysis: 'Analisis',
    recommendation: 'Rekomendasi',
    optimization: 'Optimisasi',
  },
};

export class I18n {
  private currentLanguage: SupportedLanguage = 'en';

  constructor(language: SupportedLanguage = 'en') {
    this.currentLanguage = language;
  }

  /**
   * Set the current language
   */
  public setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  /**
   * Get the current language
   */
  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Get translation for a key
   */
  public t(key: keyof TranslationStrings): string {
    return translations[this.currentLanguage][key] || translations.en[key] || key;
  }

  /**
   * Get translation with interpolation
   */
  public translate(key: keyof TranslationStrings, params?: Record<string, string | number>): string {
    let text = this.t(key);
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
      });
    }
    
    return text;
  }

  /**
   * Get all translations for current language
   */
  public getTranslations(): TranslationStrings {
    return translations[this.currentLanguage];
  }

  /**
   * Format currency based on language
   */
  public formatCurrency(amount: number, currency: string = 'IDR'): string {
    if (currency === 'IDR') {
      if (this.currentLanguage === 'id') {
        return `Rp ${amount.toLocaleString('id-ID')}`;
      } else {
        return `Rp ${amount.toLocaleString('en-US')}`;
      }
    }
    
    return `${currency} ${amount.toLocaleString(this.currentLanguage === 'id' ? 'id-ID' : 'en-US')}`;
  }

  /**
   * Format date based on language
   */
  public formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return this.t('today');
    if (diffDays === 1) return this.t('yesterday');
    
    if (diffDays <= 7) {
      return this.currentLanguage === 'id' 
        ? `${diffDays} hari yang lalu`
        : `${diffDays} days ago`;
    }
    
    const locale = this.currentLanguage === 'id' ? 'id-ID' : 'en-US';
    return date.toLocaleDateString(locale, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * Get category name in current language
   */
  public getCategoryName(category: string): string {
    const categoryKey = category.toLowerCase() as keyof TranslationStrings;
    
    // Check if the category exists in translations
    if (categoryKey in translations[this.currentLanguage]) {
      return this.t(categoryKey);
    }
    
    return category; // Return original if no translation found
  }

  /**
   * Get localized examples for help text
   */
  public getExamples(): {
    addTransaction: string[];
    viewTransactions: string[];
    dashboard: string[];
    subscriptions: string[];
  } {
    if (this.currentLanguage === 'id') {
      return {
        addTransaction: [
          'Saya habiskan 50000 untuk makan hari ini',
          'Tambah pengeluaran transportasi 25000',
          'Beli kopi 15000',
          'Bayar listrik 200000 kemarin'
        ],
        viewTransactions: [
          'Tampilkan transaksi terbaru',
          'Lihat pengeluaran makanan minggu ini',
          'Transaksi bulan lalu',
          'Riwayat belanja'
        ],
        dashboard: [
          'Tampilkan ringkasan pengeluaran',
          'Berapa yang saya habiskan minggu ini?',
          'Dashboard saya',
          'Analisis pengeluaran'
        ],
        subscriptions: [
          'Tampilkan langganan saya',
          'Tambah langganan Netflix 169000 bulanan',
          'Langganan yang akan jatuh tempo',
          'Ringkasan langganan'
        ]
      };
    } else {
      return {
        addTransaction: [
          'I spent 50000 on food today',
          'Add 25000 transportation expense',
          'Bought coffee for 15000',
          'Paid electricity bill 200000 yesterday'
        ],
        viewTransactions: [
          'Show my recent transactions',
          'View food expenses this week',
          'Last month transactions',
          'Shopping history'
        ],
        dashboard: [
          'Show my spending summary',
          'How much did I spend this week?',
          'My dashboard',
          'Spending analysis'
        ],
        subscriptions: [
          'Show my subscriptions',
          'Add Netflix subscription 169000 monthly',
          'Upcoming subscription payments',
          'Subscription summary'
        ]
      };
    }
  }

  /**
   * Detect language from user input
   */
  public static detectLanguage(text: string): SupportedLanguage {
    const indonesianKeywords = [
      'saya', 'aku', 'habiskan', 'beli', 'bayar', 'tambah', 'tampilkan', 'lihat',
      'pengeluaran', 'transaksi', 'langganan', 'ringkasan', 'dashboard',
      'makanan', 'transportasi', 'belanja', 'hiburan', 'kesehatan',
      'hari', 'kemarin', 'minggu', 'bulan', 'tahun', 'rupiah', 'ribu'
    ];
    
    const lowerText = text.toLowerCase();
    const indonesianMatches = indonesianKeywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length;
    
    // If more than 2 Indonesian keywords found, assume Indonesian
    return indonesianMatches >= 2 ? 'id' : 'en';
  }

  /**
   * Get help text in current language
   */
  public getHelpText(isAuthenticated: boolean): string {
    const examples = this.getExamples();
    
    if (this.currentLanguage === 'id') {
      let help = `🤖 **Bantuan Asisten AI Clair**\n\n`;
      
      if (isAuthenticated) {
        help += `**💸 ${this.t('transactionManagement')}:**\n`;
        examples.addTransaction.forEach(example => {
          help += `• "${example}"\n`;
        });
        help += '\n';
        
        help += `**📊 ${this.t('dashboardInsights')}:**\n`;
        examples.dashboard.forEach(example => {
          help += `• "${example}"\n`;
        });
        help += '\n';
        
        help += `**🔄 ${this.t('subscriptionManagement')}:**\n`;
        examples.subscriptions.forEach(example => {
          help += `• "${example}"\n`;
        });
        help += '\n';
        
        help += `**⚙️ ${this.t('accountManagement')}:**\n`;
        help += `• "status akun" - Cek status koneksi\n`;
        help += `• "putuskan akun" - Hapus koneksi akun\n\n`;
        
        help += `💬 **${this.t('naturalLanguage')}:** Bicara secara natural - saya mengerti konteks dan pertanyaan lanjutan!`;
      } else {
        help += `**🔗 ${this.t('gettingStarted')}:**\n`;
        help += `• "hubungkan akun" - Hubungkan akun Clair Anda\n`;
        help += `• "link demo" - Coba dengan data demo\n\n`;
        
        help += `**📚 ${this.t('afterLinking')}:**\n`;
        help += `• Tambah transaksi dengan mendeskripsikannya\n`;
        help += `• Lihat ringkasan dan wawasan pengeluaran\n`;
        help += `• Kelola langganan secara percakapan\n`;
        help += `• Dapatkan saran keuangan personal\n\n`;
        
        help += `**❓ ${this.t('needHelp')}**\n`;
        help += `• "bantuan" - Tampilkan pesan ini\n`;
        help += `• "status akun" - Cek status koneksi\n\n`;
        
        help += `🚀 Siap memulai? Ketik "hubungkan akun"!`;
      }
      
      return help;
    } else {
      // Return English help (existing implementation)
      let help = `🤖 **Clair AI Assistant Help**\n\n`;
      
      if (isAuthenticated) {
        help += `**💸 ${this.t('transactionManagement')}:**\n`;
        examples.addTransaction.forEach(example => {
          help += `• "${example}"\n`;
        });
        help += '\n';
        
        help += `**📊 ${this.t('dashboardInsights')}:**\n`;
        examples.dashboard.forEach(example => {
          help += `• "${example}"\n`;
        });
        help += '\n';
        
        help += `**🔄 ${this.t('subscriptionManagement')}:**\n`;
        examples.subscriptions.forEach(example => {
          help += `• "${example}"\n`;
        });
        help += '\n';
        
        help += `**⚙️ ${this.t('accountManagement')}:**\n`;
        help += `• "account status" - Check your link status\n`;
        help += `• "unlink account" - Remove account link\n\n`;
        
        help += `💬 **${this.t('naturalLanguage')}:** Just talk naturally - I understand context and follow-up questions!`;
      } else {
        help += `**🔗 ${this.t('gettingStarted')}:**\n`;
        help += `• "link account" - Connect your Clair account\n`;
        help += `• "demo link" - Try with demo data\n\n`;
        
        help += `**📚 ${this.t('afterLinking')}:**\n`;
        help += `• Add transactions by describing them\n`;
        help += `• View spending summaries and insights\n`;
        help += `• Manage subscriptions conversationally\n`;
        help += `• Get personalized financial advice\n\n`;
        
        help += `**❓ ${this.t('needHelp')}**\n`;
        help += `• "help" - Show this message\n`;
        help += `• "account status" - Check link status\n\n`;
        
        help += `🚀 Ready to get started? Type "link account"!`;
      }
      
      return help;
    }
  }
}

// Export singleton instance
export const i18n = new I18n();

// Helper function to create language-specific instance
export function createI18n(language: SupportedLanguage): I18n {
  return new I18n(language);
}