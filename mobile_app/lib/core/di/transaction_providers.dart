import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../transaction_repository.dart';

// For now, use a mock list of transactions for demonstration.
final transactionListProvider = Provider<List<Transaction>>((ref) {
  return [
    Transaction()
      ..id = 1
      ..userId = 'user1'
      ..amount = 50000
      ..category = TransactionCategory.food
      ..note = 'Lunch'
      ..date = DateTime.now()
      ..createdAt = DateTime.now()
      ..updatedAt = DateTime.now(),
    Transaction()
      ..id = 2
      ..userId = 'user1'
      ..amount = 120000
      ..category = TransactionCategory.shopping
      ..note = 'Groceries'
      ..date = DateTime.now().subtract(const Duration(days: 1))
      ..createdAt = DateTime.now().subtract(const Duration(days: 1))
      ..updatedAt = DateTime.now().subtract(const Duration(days: 1)),
    Transaction()
      ..id = 3
      ..userId = 'user1'
      ..amount = 30000
      ..category = TransactionCategory.transport
      ..note = 'Taxi'
      ..date = DateTime.now().subtract(const Duration(days: 7))
      ..createdAt = DateTime.now().subtract(const Duration(days: 7))
      ..updatedAt = DateTime.now().subtract(const Duration(days: 7)),
  ];
});