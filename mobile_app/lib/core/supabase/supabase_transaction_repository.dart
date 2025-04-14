import 'package:isar/isar.dart';
// supabase_transaction_repository.dart
import '../transaction_repository.dart';

class SupabaseTransactionRepository implements TransactionRepository {
  @override
  Future<List<Transaction>> getTransactions({String? userId}) async {
    // TODO: Implement Supabase transaction retrieval
    throw UnimplementedError();
  }

  @override
  Future<void> addTransaction(Transaction transaction) async {
    // TODO: Implement Supabase transaction addition
    throw UnimplementedError();
  }

  @override
  Future<void> updateTransaction(Transaction transaction) async {
    // TODO: Implement Supabase transaction update
    throw UnimplementedError();
  }

  @override
  Future<void> deleteTransaction(Id id) async {
    // TODO: Implement Supabase transaction deletion
    throw UnimplementedError();
  }
}