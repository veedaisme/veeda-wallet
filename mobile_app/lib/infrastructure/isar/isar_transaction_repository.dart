import 'package:isar/isar.dart';
import 'package:clair_wallet/core/transaction_repository.dart';

class IsarTransactionRepository implements TransactionRepository {
  final Isar isar;

  IsarTransactionRepository(this.isar);

  @override
  Future<void> addTransaction(Transaction transaction) async {
    await isar.writeTxn(() async {
      await isar.transactions.put(transaction);
    });
  }

  @override
  Future<void> deleteTransaction(Id id) async {
    await isar.writeTxn(() async {
      await isar.transactions.delete(id);
    });
  }

  @override
  Stream<List<Transaction>> getTransactions({String? userId}) {
    // For Isar, ensure 'userId' is indexed in the Transaction collection for efficient querying
    // if you plan to filter by it frequently.
    if (userId != null) {
      // Assuming 'userId' is a field in your Transaction object that can be filtered.
      // Make sure the Transaction collection has an index on 'userId' for performance.
      return isar.transactions.filter().userIdEqualTo(userId).sortByDateDesc().watch(fireImmediately: true);
    }
    // If no userId is provided, fetch all transactions. Be cautious with large datasets.
    return isar.transactions.where().sortByDateDesc().watch(fireImmediately: true);
  }

  @override
  Future<void> updateTransaction(Transaction transaction) async {
    // Isar's put operation handles both create and update based on the Id.
    // If a transaction with the same Id exists, it's updated; otherwise, it's inserted.
    await isar.writeTxn(() async {
      await isar.transactions.put(transaction);
    });
  }
}
