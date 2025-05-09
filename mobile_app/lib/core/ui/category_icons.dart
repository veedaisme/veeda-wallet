import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:veeda_wallet/core/transaction_repository.dart';

IconData getLucideIconForCategory(TransactionCategory category) {
  switch (category) {
    case TransactionCategory.food:
      return LucideIcons.coffee; // Was Utensils
    case TransactionCategory.transport:
      return LucideIcons.car; // Was Siren
    case TransactionCategory.shopping:
      return LucideIcons.shoppingBag; // Matches web
    case TransactionCategory.entertainment:
      return LucideIcons.film; // Was Popcorn
    case TransactionCategory.utilities:
      return LucideIcons.lightbulb; // Matches web
    case TransactionCategory.health:
      return LucideIcons.heart; // Was HeartPulse
    // Note: Web has 'housing', 'education', 'travel' which are not in mobile enum yet.
    // If added to mobile enum, map them here.
    case TransactionCategory.other:
      return LucideIcons.moreHorizontal; // Was HelpCircle
  }
}
