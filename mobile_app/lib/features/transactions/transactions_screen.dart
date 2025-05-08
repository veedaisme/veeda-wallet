import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/di/transaction_providers.dart';
import '../../core/transaction_repository.dart';

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
      appBar: AppBar(
        title: const Text('Transactions'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      labelText: 'Search by note',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8.0),
                      ),
                    ),
                    onChanged: (value) => setState(() {}), // Rebuild to filter
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.calendar_today),
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
                    icon: const Icon(Icons.clear),
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
                List<Transaction> filteredTransactions = transactions;

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
                  return const Center(child: Text('No transactions found.'));
                }

                return RefreshIndicator(
                  onRefresh: () => ref.refresh(transactionListProvider.future),
                  child: ListView.builder(
                    itemCount: filteredTransactions.length,
                    itemBuilder: (context, index) {
                      final transaction = filteredTransactions[index];
                      return ListTile(
                        leading: CircleAvatar(
                          child: Text(transaction.category.name[0].toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold)),
                        ),
                        title: Text(transaction.note ?? 'No note'),
                        subtitle: Text(DateFormat('dd MMM yyyy, HH:mm').format(transaction.date)),
                        trailing: Text(
                          'Rp ${transaction.amount.toStringAsFixed(0)}',
                          style: TextStyle(
                            color: transaction.amount < 0 ? Colors.red : Colors.green,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        // TODO: Add onTap for editing or deleting transaction
                      );
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
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Open add transaction modal
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}