import 'package:isar/isar.dart';
// local_transaction_repository.dart
import '../transaction_repository.dart';

class LocalTransactionRepository implements TransactionRepository {
  @override
  Stream<List<Transaction>> getTransactions({String? userId}) {
    // TODO: Implement local storage stream fetching if needed
    print('LocalTransactionRepository.getTransactions called - returning empty stream');
    return Stream.value([]); // Return an empty stream for now
  }

  @override
  Future<void> addTransaction(Transaction transaction) async {
    // TODO: Implement local transaction addition
    throw UnimplementedError();
  }

  @override
  Future<void> updateTransaction(Transaction transaction) async {
    // TODO: Implement local transaction update
    throw UnimplementedError();
  }

  @override
  Future<void> deleteTransaction(Id id) async {
    // TODO: Implement local transaction deletion
    throw UnimplementedError();
  }
}