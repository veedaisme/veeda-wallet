// providers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:get_it/get_it.dart';

import '../auth_repository.dart';
import '../transaction_repository.dart';
import '../storage/local_auth_service.dart';

// Access repositories via get_it
final getIt = GetIt.instance;

final localAuthServiceProvider = Provider<LocalAuthService>((ref) {
  return getIt<LocalAuthService>();
});

// Auth state provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return getIt<AuthRepository>();
});

// Transaction list provider
final transactionRepositoryProvider = Provider<TransactionRepository>((ref) {
  return getIt<TransactionRepository>();
});

// Example: Auth state/session (replace with actual implementation)
final authStateProvider = StateProvider<User?>((ref) => null);

// Example: Transaction list (replace with actual implementation)
final transactionListProvider = StateProvider<List<Transaction>>((ref) => []);

// Example: Dashboard summaries (replace with actual implementation)
final dashboardSummaryProvider = StateProvider<Map<String, double>>((ref) => {});

// Example: UI state (modals, navigation, etc.)
final uiStateProvider = StateProvider<Map<String, dynamic>>((ref) => {});