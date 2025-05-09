import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/di/transaction_providers.dart';
import '../../core/transaction_repository.dart';
// import '../../core/ui/category_icons.dart'; // No longer used directly here
// import './widgets/add_transaction_modal.dart'; // No longer used directly here
import './widgets/transaction_list_item_card.dart';
import '../../core/ui/widgets/add_transaction_fab.dart';

class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  final TextEditingController _searchController = TextEditingController();
  DateTime? _selectedDate;

  @override
  Widget build(BuildContext context) {
    final transactionsAsyncValue = ref.watch(transactionListProvider);

    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search by note',
                      prefixIcon: const Icon(LucideIcons.search, size: 20),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30.0),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 20),
                    ),
                    onChanged: (value) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(LucideIcons.calendarDays, size: 20),
                  onPressed: () async {
                    final DateTime? picked = await showDatePicker(
                      context: context,
                      initialDate: _selectedDate ?? DateTime.now(),
                      firstDate: DateTime(2000),
                      lastDate: DateTime(2101),
                    );
                    if (picked != null && picked != _selectedDate) {
                      setState(() {
                        _selectedDate = picked;
                      });
                    }
                  },
                ),
                if (_selectedDate != null)
                  IconButton(
                    icon: const Icon(LucideIcons.xCircle, size: 20, color: Colors.grey),
                    onPressed: () {
                      setState(() {
                        _selectedDate = null;
                      });
                    },
                  ),
              ],
            ),
          ),
          Expanded(
            child: transactionsAsyncValue.when(
              data: (transactions) {
                List<Transaction> filteredTransactions = List.from(transactions);

                filteredTransactions.sort((a, b) => b.date.compareTo(a.date));

                if (_searchController.text.isNotEmpty) {
                  filteredTransactions = filteredTransactions.where((tx) {
                    return tx.note?.toLowerCase().contains(_searchController.text.toLowerCase()) ?? false;
                  }).toList();
                }

                if (_selectedDate != null) {
                  filteredTransactions = filteredTransactions.where((tx) {
                    return tx.date.year == _selectedDate!.year &&
                           tx.date.month == _selectedDate!.month &&
                           tx.date.day == _selectedDate!.day;
                  }).toList();
                }
                
                if (filteredTransactions.isEmpty) {
                  return const Center(child: Text('No transactions found.', style: TextStyle(color: Colors.grey)));
                }

                return RefreshIndicator(
                  onRefresh: () => ref.refresh(transactionListProvider.future),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                    itemCount: filteredTransactions.length,
                    itemBuilder: (context, index) {
                      final transaction = filteredTransactions[index];
                      return TransactionListItemCard(transaction: transaction);
                    },
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(child: Text('Error: $err')),
            ),
          ),
        ],
      ),
      floatingActionButton: const AddTransactionFAB(),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}