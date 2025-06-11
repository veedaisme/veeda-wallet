import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import 'package:clair_wallet/core/transaction_repository.dart'; // For TransactionSchema

final isarProvider = FutureProvider<Isar>((ref) async {
  final dir = await getApplicationDocumentsDirectory();
  final isar = await Isar.open(
    [TransactionSchema], // Add other schemas here if you have more collections
    directory: dir.path,
  );
  return isar;
});
