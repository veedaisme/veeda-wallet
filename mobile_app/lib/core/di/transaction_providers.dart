import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:veeda_wallet/core/transaction_repository.dart';
import 'package:veeda_wallet/infrastructure/isar/isar_transaction_repository.dart';
import 'package:veeda_wallet/core/di/isar_provider.dart'; // Import the isarProvider

// Provider for the TransactionRepository interface
final transactionRepositoryProvider = Provider<TransactionRepository>((ref) {
  // Watch the isarProvider. This will re-build consumers when the Isar instance is ready.
  // We need to handle the AsyncValue state from isarProvider.
  final isarAsyncValue = ref.watch(isarProvider);

  // Return a concrete implementation, or a fallback/mock if Isar isn't ready or errored.
  // For simplicity, we'll throw if Isar isn't ready, but in a real app, 
  // you might return a mock or a repository that signals it's not initialized.
  return isarAsyncValue.when(
    data: (isarInstance) => IsarTransactionRepository(isarInstance),
    loading: () {
      // While Isar is loading, we can return a temporary mock or throw an error.
      // Throwing an error might be too disruptive. Returning a non-functional mock or 
      // a specific state could be better handled by consumers.
      // For now, let's return a _LoadingTransactionRepository or similar if needed,
      // or rely on consumers of transactionListProvider to show loading state.
      // To keep it simple and rely on FutureProvider's loading state down the chain:
      throw Exception('Isar instance is not yet available. UI should show loading state.');
    },
    error: (err, stack) {
      // Handle error state, e.g., log it and return a mock or throw.
      print('Error initializing Isar: $err');
      throw Exception('Failed to initialize Isar: $err. UI should show error state.');
    },
  );
});

// New provider to fetch the list of transactions using the repository
final transactionListProvider = StreamProvider<List<Transaction>>((ref) {
  final repository = ref.watch(transactionRepositoryProvider);
  // You might want to pass a userId or other filters here in a real scenario
  return repository.getTransactions(); 
});