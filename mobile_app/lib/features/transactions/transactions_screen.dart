import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/di/transaction_providers.dart';
import '../../core/transaction_repository.dart';
import '../../core/utils/currency.dart';

class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  String _searchQuery = '';
  String _sortBy = 'date_desc';

  @override
  Widget build(BuildContext context) {
    final transactions = ref.watch(transactionListProvider);

    // Filter and sort transactions
    List<Transaction> filtered = transactions.where((tx) {
      return _searchQuery.isEmpty ||
          (tx.note?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
    }).toList();

    if (_sortBy == 'date_desc') {
      filtered.sort((a, b) => b.date.compareTo(a.date));
    } else if (_sortBy == 'date_asc') {
      filtered.sort((a, b) => a.date.compareTo(b.date));
    } else if (_sortBy == 'amount_desc') {
      filtered.sort((a, b) => b.amount.compareTo(a.amount));
    } else if (_sortBy == 'amount_asc') {
      filtered.sort((a, b) => a.amount.compareTo(b.amount));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transactions'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: const InputDecoration(
                      hintText: 'Search by note...',
                      prefixIcon: Icon(Icons.search),
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    onChanged: (value) {
                      setState(() {
                        _searchQuery = value;
                      });
                    },
                  ),
                ),
                const SizedBox(width: 12),
                DropdownButton<String>(
                  value: _sortBy,
                  items: const [
                    DropdownMenuItem(
                      value: 'date_desc',
                      child: Text('Newest'),
                    ),
                    DropdownMenuItem(
                      value: 'date_asc',
                      child: Text('Oldest'),
                    ),
                    DropdownMenuItem(
                      value: 'amount_desc',
                      child: Text('Amount ↓'),
                    ),
                    DropdownMenuItem(
                      value: 'amount_asc',
                      child: Text('Amount ↑'),
                    ),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _sortBy = value;
                      });
                    }
                  },
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final tx = filtered[index];
                return ListTile(
                  leading: CircleAvatar(
                    child: Text(tx.category.name[0].toUpperCase()),
                  ),
                  title: Text(formatRupiah(tx.amount)),
                  subtitle: Text(
                    '${tx.category.name} • ${tx.note ?? ''}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: Text(
                    '${tx.date.month}/${tx.date.day}',
                    style: const TextStyle(fontSize: 12),
                  ),
                  onTap: () {
                    // TODO: Open edit modal
                  },
                );
              },
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
}