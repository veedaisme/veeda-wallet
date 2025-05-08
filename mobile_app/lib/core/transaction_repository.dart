// transaction_repository.dart
import 'package:isar/isar.dart';

part 'transaction_repository.g.dart'; // Link to the generated file

enum TransactionCategory {
  food,
  transport,
  shopping,
  entertainment,
  utilities,
  health,
  other,
}

@Collection()
class Transaction {
  Id id = Isar.autoIncrement;

  late String userId;
  late double amount;

  @Enumerated(EnumType.name)
  late TransactionCategory category;
  String? note;
  late DateTime date;
  late DateTime createdAt;
  late DateTime updatedAt;

  Transaction();

  // Add serialization/deserialization for Supabase/JSON as needed
}

abstract class TransactionRepository {
  Future<List<Transaction>> getTransactions({String? userId});
  Future<void> addTransaction(Transaction transaction);
  Future<void> updateTransaction(Transaction transaction);
  Future<void> deleteTransaction(Id id);
}