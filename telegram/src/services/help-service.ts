import { Logger } from '@/utils/logger';
import { MessageFormatter } from '@/utils/message-formatter';
import { UserContext } from '@/types/auth';

const logger = new Logger('HelpService');

export interface HelpCommand {
  command: string;
  description: string;
  usage: string;
  examples: string[];
  category: 'basic' | 'transactions' | 'dashboard' | 'subscriptions' | 'settings';
  requiresAuth: boolean;
  aliases?: string[];
}

export interface HelpCategory {
  name: string;
  description: string;
  icon: string;
  commands: HelpCommand[];
}

export interface ContextualHelp {
  situation: string;
  suggestions: string[];
  examples: string[];
  relatedCommands: string[];
}

/**
 * Help service for providing contextual assistance and command guidance
 */
export class HelpService {
  private static instance: HelpService;
  private messageFormatter: MessageFormatter;
  private commands: Map<string, HelpCommand> = new Map();
  private categories: Map<string, HelpCategory> = new Map();

  private constructor() {
    this.messageFormatter = new MessageFormatter();
    this.initializeCommands();
    this.initializeCategories();
    logger.info('Help service initialized');
  }

  public static getInstance(): HelpService {
    if (!HelpService.instance) {
      HelpService.instance = new HelpService();
    }
    return HelpService.instance;
  }

  /**
   * Initialize available commands
   */
  private initializeCommands(): void {
    const commands: HelpCommand[] = [
      // Basic Commands
      {
        command: 'start',
        description: 'Start using Clair AI Assistant',
        usage: '/start',
        examples: ['/start'],
        category: 'basic',
        requiresAuth: false,
      },
      {
        command: 'help',
        description: 'Show help and available commands',
        usage: '/help [topic]',
        examples: ['/help', '/help transactions', 'help dashboard'],
        category: 'basic',
        requiresAuth: false,
        aliases: ['help'],
      },
      {
        command: 'link',
        description: 'Link your Clair account to start tracking expenses',
        usage: '/link or "link account"',
        examples: ['/link', 'link account', 'connect my account'],
        category: 'basic',
        requiresAuth: false,
        aliases: ['link account', 'connect account'],
      },
      {
        command: 'unlink',
        description: 'Unlink your Clair account',
        usage: '/unlink or "unlink account"',
        examples: ['/unlink', 'unlink account', 'disconnect account'],
        category: 'basic',
        requiresAuth: true,
        aliases: ['unlink account', 'disconnect'],
      },
      {
        command: 'status',
        description: 'Check your account connection status',
        usage: '/status or "account status"',
        examples: ['/status', 'account status', 'check status'],
        category: 'basic',
        requiresAuth: false,
        aliases: ['account status'],
      },

      // Transaction Commands
      {
        command: 'add_transaction',
        description: 'Add a new expense by describing it naturally',
        usage: 'Just describe your expense naturally',
        examples: [
          'I spent 50000 on lunch today',
          'Bought groceries for 150000',
          'Paid 25000 for bus fare',
          'Coffee 15000',
        ],
        category: 'transactions',
        requiresAuth: true,
      },
      {
        command: 'transactions',
        description: 'View your recent transactions',
        usage: '/transactions or describe what you want to see',
        examples: [
          '/transactions',
          'show my recent transactions',
          'view my expenses',
          'what did I spend today?',
        ],
        category: 'transactions',
        requiresAuth: true,
        aliases: ['show transactions', 'recent transactions'],
      },
      {
        command: 'filter_transactions',
        description: 'Filter transactions by category, date, or amount',
        usage: 'Describe the filter you want',
        examples: [
          'show my food expenses',
          'transportation costs this week',
          'expenses over 100000',
          'transactions from last month',
        ],
        category: 'transactions',
        requiresAuth: true,
      },
      {
        command: 'search_transactions',
        description: 'Search transactions by description or merchant',
        usage: 'Search for specific transactions',
        examples: [
          'find McDonald transactions',
          'search for Grab rides',
          'transactions with coffee',
        ],
        category: 'transactions',
        requiresAuth: true,
      },

      // Dashboard Commands
      {
        command: 'dashboard',
        description: 'View your spending dashboard and summary',
        usage: '/dashboard or ask for spending summary',
        examples: [
          '/dashboard',
          'show my dashboard',
          'spending summary',
          'how much did I spend?',
        ],
        category: 'dashboard',
        requiresAuth: true,
        aliases: ['spending dashboard', 'summary'],
      },
      {
        command: 'insights',
        description: 'Get personalized spending insights and recommendations',
        usage: '/insights or ask for spending advice',
        examples: [
          '/insights',
          'give me insights',
          'spending advice',
          'financial recommendations',
        ],
        category: 'dashboard',
        requiresAuth: true,
        aliases: ['spending insights', 'financial advice'],
      },
      {
        command: 'analysis',
        description: 'Get comprehensive spending analysis',
        usage: 'Ask for detailed analysis',
        examples: [
          'comprehensive analysis',
          'detailed spending report',
          'analyze my spending patterns',
        ],
        category: 'dashboard',
        requiresAuth: true,
      },

      // Subscription Commands
      {
        command: 'subscriptions',
        description: 'View and manage your subscriptions',
        usage: '/subscriptions or ask about subscriptions',
        examples: [
          '/subscriptions',
          'show my subscriptions',
          'active subscriptions',
          'subscription list',
        ],
        category: 'subscriptions',
        requiresAuth: true,
        aliases: ['show subscriptions', 'subscription list'],
      },
      {
        command: 'add_subscription',
        description: 'Add a new subscription',
        usage: 'Describe your subscription naturally',
        examples: [
          'add Netflix subscription 169000 monthly',
          'I have Spotify premium 55000 per month',
          'YouTube Premium 79000 monthly',
        ],
        category: 'subscriptions',
        requiresAuth: true,
      },
      {
        command: 'subscription_summary',
        description: 'Get subscription cost summary',
        usage: 'Ask for subscription summary',
        examples: [
          'subscription summary',
          'total subscription costs',
          'how much do I pay for subscriptions?',
        ],
        category: 'subscriptions',
        requiresAuth: true,
      },
      {
        command: 'upcoming_payments',
        description: 'View upcoming subscription payments',
        usage: 'Ask about upcoming payments',
        examples: [
          'upcoming payments',
          'when are my next payments?',
          'subscription due dates',
        ],
        category: 'subscriptions',
        requiresAuth: true,
      },

      // Settings Commands
      {
        command: 'settings',
        description: 'Manage your preferences and settings',
        usage: '/settings or ask about preferences',
        examples: [
          '/settings',
          'my preferences',
          'change settings',
          'update preferences',
        ],
        category: 'settings',
        requiresAuth: true,
        aliases: ['preferences'],
      },
    ];

    // Store commands in map for quick lookup
    commands.forEach(cmd => {
      this.commands.set(cmd.command, cmd);
      
      // Also store aliases
      if (cmd.aliases) {
        cmd.aliases.forEach(alias => {
          this.commands.set(alias.toLowerCase(), cmd);
        });
      }
    });

    logger.info(`Initialized ${commands.length} help commands`);
  }

  /**
   * Initialize help categories
   */
  private initializeCategories(): void {
    const categories: HelpCategory[] = [
      {
        name: 'basic',
        description: 'Getting started and account management',
        icon: '🚀',
        commands: Array.from(this.commands.values()).filter(cmd => cmd.category === 'basic'),
      },
      {
        name: 'transactions',
        description: 'Adding and viewing your expenses',
        icon: '💸',
        commands: Array.from(this.commands.values()).filter(cmd => cmd.category === 'transactions'),
      },
      {
        name: 'dashboard',
        description: 'Spending summaries and insights',
        icon: '📊',
        commands: Array.from(this.commands.values()).filter(cmd => cmd.category === 'dashboard'),
      },
      {
        name: 'subscriptions',
        description: 'Managing recurring payments',
        icon: '🔄',
        commands: Array.from(this.commands.values()).filter(cmd => cmd.category === 'subscriptions'),
      },
      {
        name: 'settings',
        description: 'Preferences and configuration',
        icon: '⚙️',
        commands: Array.from(this.commands.values()).filter(cmd => cmd.category === 'settings'),
      },
    ];

    categories.forEach(category => {
      this.categories.set(category.name, category);
    });

    logger.info(`Initialized ${categories.length} help categories`);
  }

  /**
   * Get general help message
   */
  public getGeneralHelp(userContext?: UserContext): string {
    const isAuthenticated = !!userContext;
    
    let help = '🤖 **Clair AI Assistant Help**\n\n';
    
    if (!isAuthenticated) {
      help += '**🔗 Getting Started:**\n';
      help += '• Type "link account" to connect your Clair account\n';
      help += '• Use "/help" anytime to see this message\n\n';
      
      help += '**📚 What you can do after linking:**\n';
      help += '• Add transactions by describing them naturally\n';
      help += '• View spending summaries and insights\n';
      help += '• Manage subscriptions conversationally\n';
      help += '• Get personalized financial advice\n\n';
      
      help += '🚀 **Ready to get started?** Type "link account"!';
    } else {
      // Show categorized help for authenticated users
      for (const [categoryName, category] of this.categories.entries()) {
        const availableCommands = category.commands.filter(cmd => 
          !cmd.requiresAuth || isAuthenticated
        );
        
        if (availableCommands.length > 0) {
          help += `**${category.icon} ${category.description}:**\n`;
          
          availableCommands.slice(0, 3).forEach(cmd => {
            const example = cmd.examples[0];
            help += `• ${example} - ${cmd.description}\n`;
          });
          
          if (availableCommands.length > 3) {
            help += `• Type "/help ${categoryName}" for more ${categoryName} commands\n`;
          }
          
          help += '\n';
        }
      }
      
      help += '💬 **Natural Language:** Just talk naturally - I understand context and follow-up questions!\n\n';
      
      if (userContext) {
        help += '**Your Settings:**\n';
        help += `• Language: ${userContext.preferences.language}\n`;
        help += `• Currency: ${userContext.preferences.currency}\n`;
        help += `• Notifications: ${userContext.preferences.notifications ? 'On' : 'Off'}\n\n`;
      }
      
      help += '❓ **Need specific help?** Try:\n';
      help += '• "/help transactions" for expense tracking\n';
      help += '• "/help dashboard" for spending insights\n';
      help += '• "/help subscriptions" for recurring payments';
    }
    
    return help;
  }

  /**
   * Get help for a specific category
   */
  public getCategoryHelp(categoryName: string, userContext?: UserContext): string {
    const category = this.categories.get(categoryName.toLowerCase());
    
    if (!category) {
      return this.getSuggestedHelp(`Unknown category: ${categoryName}`, userContext);
    }
    
    const isAuthenticated = !!userContext;
    const availableCommands = category.commands.filter(cmd => 
      !cmd.requiresAuth || isAuthenticated
    );
    
    if (availableCommands.length === 0) {
      return `${category.icon} **${category.description}**\n\n` +
             'These features require account linking. Type "link account" to get started!';
    }
    
    let help = `${category.icon} **${category.description}**\n\n`;
    
    availableCommands.forEach(cmd => {
      help += `**${cmd.description}**\n`;
      help += `Usage: ${cmd.usage}\n`;
      help += `Examples:\n`;
      cmd.examples.forEach(example => {
        help += `• ${example}\n`;
      });
      help += '\n';
    });
    
    help += `💡 **Tip:** You can also use natural language - just describe what you want to do!`;
    
    return help;
  }

  /**
   * Get help for a specific command
   */
  public getCommandHelp(commandName: string, userContext?: UserContext): string {
    const command = this.commands.get(commandName.toLowerCase());
    
    if (!command) {
      return this.getSuggestedHelp(`Unknown command: ${commandName}`, userContext);
    }
    
    const isAuthenticated = !!userContext;
    
    if (command.requiresAuth && !isAuthenticated) {
      return `🔒 **${command.description}**\n\n` +
             'This feature requires account linking. Type "link account" to get started!';
    }
    
    let help = `**${command.description}**\n\n`;
    help += `**Usage:** ${command.usage}\n\n`;
    help += `**Examples:**\n`;
    command.examples.forEach(example => {
      help += `• ${example}\n`;
    });
    
    if (command.aliases && command.aliases.length > 0) {
      help += `\n**Also works with:** ${command.aliases.join(', ')}\n`;
    }
    
    // Add related commands
    const relatedCommands = Array.from(this.commands.values())
      .filter(cmd => cmd.category === command.category && cmd.command !== command.command)
      .slice(0, 3);
    
    if (relatedCommands.length > 0) {
      help += `\n**Related commands:**\n`;
      relatedCommands.forEach(cmd => {
        help += `• ${cmd.examples[0]} - ${cmd.description}\n`;
      });
    }
    
    return help;
  }

  /**
   * Get contextual help based on user situation
   */
  public getContextualHelp(situation: string, userContext?: UserContext): string {
    const contextualHelps: ContextualHelp[] = [
      {
        situation: 'first_time_user',
        suggestions: [
          'Start by linking your Clair account',
          'Try adding your first transaction',
          'Explore the help system',
        ],
        examples: [
          'link account',
          'I spent 25000 on lunch',
          'help',
        ],
        relatedCommands: ['link', 'help', 'start'],
      },
      {
        situation: 'transaction_error',
        suggestions: [
          'Be more specific about the amount',
          'Include the category or merchant',
          'Try using numbers instead of words',
        ],
        examples: [
          'I spent 50000 on food today',
          'Bought groceries at Indomaret for 150000',
          'Transportation 25000',
        ],
        relatedCommands: ['add_transaction', 'transactions'],
      },
      {
        situation: 'no_transactions',
        suggestions: [
          'Add your first transaction',
          'Try describing a recent expense',
          'Use natural language to describe spending',
        ],
        examples: [
          'I bought coffee for 15000',
          'Lunch at McDonald 35000',
          'Grab ride 20000',
        ],
        relatedCommands: ['add_transaction'],
      },
      {
        situation: 'subscription_help',
        suggestions: [
          'Add subscriptions with amount and frequency',
          'View your current subscriptions',
          'Get subscription cost summary',
        ],
        examples: [
          'Netflix subscription 169000 monthly',
          'show my subscriptions',
          'subscription summary',
        ],
        relatedCommands: ['add_subscription', 'subscriptions', 'subscription_summary'],
      },
    ];
    
    const help = contextualHelps.find(h => h.situation === situation);
    
    if (!help) {
      return this.getGeneralHelp(userContext);
    }
    
    let response = '💡 **Here are some suggestions:**\n\n';
    
    help.suggestions.forEach((suggestion, index) => {
      response += `${index + 1}. ${suggestion}\n`;
      if (help.examples[index]) {
        response += `   Example: "${help.examples[index]}"\n`;
      }
    });
    
    response += '\n**Related commands:**\n';
    help.relatedCommands.forEach(cmdName => {
      const command = this.commands.get(cmdName);
      if (command) {
        response += `• ${command.examples[0]} - ${command.description}\n`;
      }
    });
    
    return response;
  }

  /**
   * Get suggested help when command is not found
   */
  public getSuggestedHelp(query: string, userContext?: UserContext): string {
    const isAuthenticated = !!userContext;
    
    // Try to find similar commands
    const suggestions = this.findSimilarCommands(query, isAuthenticated);
    
    let help = `❓ **I didn't understand "${query}"**\n\n`;
    
    if (suggestions.length > 0) {
      help += '**Did you mean:**\n';
      suggestions.forEach(cmd => {
        help += `• ${cmd.examples[0]} - ${cmd.description}\n`;
      });
      help += '\n';
    }
    
    help += '**💡 Try these instead:**\n';
    help += '• Use "/help" to see all available commands\n';
    help += '• Describe what you want to do naturally\n';
    help += '• Use "/help [category]" for specific topics\n\n';
    
    help += '**Popular commands:**\n';
    const popularCommands = isAuthenticated 
      ? ['dashboard', 'transactions', 'insights', 'subscriptions']
      : ['link', 'help', 'start'];
    
    popularCommands.forEach(cmdName => {
      const command = this.commands.get(cmdName);
      if (command) {
        help += `• ${command.examples[0]} - ${command.description}\n`;
      }
    });
    
    return help;
  }

  /**
   * Find similar commands based on query
   */
  private findSimilarCommands(query: string, isAuthenticated: boolean): HelpCommand[] {
    const queryLower = query.toLowerCase();
    const suggestions: HelpCommand[] = [];
    
    // Look for commands that contain the query or have similar keywords
    for (const command of this.commands.values()) {
      if (command.requiresAuth && !isAuthenticated) continue;
      
      // Check if command name, description, or examples contain the query
      const searchText = [
        command.command,
        command.description,
        ...command.examples,
        ...(command.aliases || []),
      ].join(' ').toLowerCase();
      
      if (searchText.includes(queryLower)) {
        suggestions.push(command);
      }
    }
    
    // Remove duplicates and limit to 3 suggestions
    const uniqueSuggestions = suggestions.filter((cmd, index, arr) => 
      arr.findIndex(c => c.command === cmd.command) === index
    );
    
    return uniqueSuggestions.slice(0, 3);
  }

  /**
   * Get quick start guide
   */
  public getQuickStartGuide(userContext?: UserContext): string {
    const isAuthenticated = !!userContext;
    
    if (!isAuthenticated) {
      return '🚀 **Quick Start Guide**\n\n' +
             '**Step 1:** Link your account\n' +
             'Type: "link account"\n\n' +
             '**Step 2:** Add your first transaction\n' +
             'Example: "I spent 25000 on lunch"\n\n' +
             '**Step 3:** View your dashboard\n' +
             'Type: "dashboard" or "show my spending"\n\n' +
             '**Step 4:** Explore features\n' +
             'Type: "help" to see all available commands\n\n' +
             '💡 **Tip:** You can talk naturally - no need for specific commands!';
    } else {
      return '🎉 **You\'re all set up!** Here\'s what you can do:\n\n' +
             '**💸 Track Expenses:**\n' +
             '• "I spent 50000 on groceries"\n' +
             '• "Coffee 15000"\n' +
             '• "Grab ride to office 25000"\n\n' +
             '**📊 View Insights:**\n' +
             '• "show my dashboard"\n' +
             '• "spending insights"\n' +
             '• "how much did I spend this week?"\n\n' +
             '**🔄 Manage Subscriptions:**\n' +
             '• "Netflix subscription 169000 monthly"\n' +
             '• "show my subscriptions"\n\n' +
             '💬 **Remember:** Just talk naturally - I understand context!';
    }
  }

  /**
   * Get feature overview
   */
  public getFeatureOverview(): string {
    return '✨ **Clair AI Assistant Features**\n\n' +
           '**🤖 Natural Language Processing**\n' +
           'Talk to me naturally - no need to remember specific commands!\n\n' +
           '**💸 Smart Expense Tracking**\n' +
           '• Automatic categorization\n' +
           '• Natural language input\n' +
           '• Transaction confirmation\n\n' +
           '**📊 Intelligent Insights**\n' +
           '• Spending patterns analysis\n' +
           '• Personalized recommendations\n' +
           '• Comparative dashboards\n\n' +
           '**🔄 Subscription Management**\n' +
           '• Track recurring payments\n' +
           '• Payment reminders\n' +
           '• Cost optimization tips\n\n' +
           '**🌐 Multi-language Support**\n' +
           '• English and Bahasa Indonesia\n' +
           '• Automatic language detection\n\n' +
           '**🔒 Secure & Private**\n' +
           '• End-to-end encryption\n' +
           '• No data sharing\n' +
           '• Privacy-first design\n\n' +
           'Ready to start? Type "link account" to begin!';
  }
}

// Export singleton instance
export const helpService = HelpService.getInstance();