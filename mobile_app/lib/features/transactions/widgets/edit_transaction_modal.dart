import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:veeda_wallet/core/transaction_repository.dart';
import 'package:veeda_wallet/core/di/transaction_providers.dart';

class EditTransactionModal extends ConsumerStatefulWidget {
  final Transaction transaction;

  const EditTransactionModal({super.key, required this.transaction});

  @override
  ConsumerState<EditTransactionModal> createState() => _EditTransactionModalState();
}

class _EditTransactionModalState extends ConsumerState<EditTransactionModal> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _amountController;
  late TextEditingController _descriptionController;
  late TransactionCategory _selectedCategory;
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    // Initialize controllers with existing transaction data
    _amountController = TextEditingController(text: widget.transaction.amount.toString());
    _descriptionController = TextEditingController(text: widget.transaction.note ?? '');
    _selectedCategory = widget.transaction.category;
    _selectedDate = widget.transaction.date;
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  void _updateTransaction() {
    if (_formKey.currentState!.validate()) {
      final amount = double.tryParse(_amountController.text);
      final note = _descriptionController.text;

      if (amount == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid amount.')),
        );
        return;
      }

      // Create updated transaction with the same ID
      final updatedTransaction = Transaction()
        ..id = widget.transaction.id
        ..userId = widget.transaction.userId
        ..amount = amount
        ..note = note
        ..date = _selectedDate
        ..category = _selectedCategory
        ..createdAt = widget.transaction.createdAt
        ..updatedAt = DateTime.now();
      
      // Update the transaction using the repository
      ref.read(transactionRepositoryProvider).updateTransaction(updatedTransaction);

      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Transaction updated successfully')),
      );

      // Close the modal
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom, 
        left: 16, 
        right: 16, 
        top: 16
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Edit Transaction', style: Theme.of(context).textTheme.titleLarge),
                IconButton(
                  icon: const Icon(LucideIcons.x),
                  onPressed: () => Navigator.of(context).pop(),
                )
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _amountController,
              decoration: const InputDecoration(
                labelText: 'Amount',
                prefixText: 'Rp ',
                hintText: '50000'
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter an amount';
                }
                if (double.tryParse(value) == null) {
                  return 'Please enter a valid number';
                }
                if (double.parse(value) <= 0) {
                  return 'Amount must be greater than zero';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(labelText: 'Note (Description)'),
              validator: (value) {
                return null; // Note is optional
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<TransactionCategory>(
              value: _selectedCategory,
              decoration: const InputDecoration(
                labelText: 'Category',
                border: OutlineInputBorder(),
              ),
              hint: const Text('Select a category'),
              isExpanded: true,
              items: TransactionCategory.values.map((TransactionCategory category) {
                // Capitalize the first letter for display
                String displayName = category.name;
                if (displayName.isNotEmpty) {
                  displayName = displayName[0].toUpperCase() + displayName.substring(1);
                }
                return DropdownMenuItem<TransactionCategory>(
                  value: category,
                  child: Text(displayName),
                );
              }).toList(),
              onChanged: (TransactionCategory? newValue) {
                if (newValue != null) {
                  setState(() {
                    _selectedCategory = newValue;
                  });
                }
              },
              validator: (value) {
                if (value == null) {
                  return 'Please select a category';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Text('Date: ${DateFormat('EEE, dd MMM yyyy').format(_selectedDate)}'),
                ),
                TextButton.icon(
                  icon: const Icon(LucideIcons.calendarDays),
                  label: const Text('Change'),
                  onPressed: () => _pickDate(context),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(LucideIcons.save),
                    label: const Text('Update Transaction'),
                    onPressed: _updateTransaction,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12)
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  icon: const Icon(LucideIcons.trash2),
                  label: const Text('Delete'),
                  onPressed: () {
                    // Show confirmation dialog before deleting
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Delete Transaction'),
                        content: const Text('Are you sure you want to delete this transaction?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(context).pop(),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () {
                              // Delete the transaction
                              ref.read(transactionRepositoryProvider).deleteTransaction(widget.transaction.id);
                              // Close the dialog and the modal
                              Navigator.of(context).pop();
                              Navigator.of(context).pop();
                              // Show success message
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Transaction deleted successfully')),
                              );
                            },
                            child: const Text('Delete', style: TextStyle(color: Colors.red)),
                          ),
                        ],
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.error,
                    foregroundColor: Theme.of(context).colorScheme.onError,
                    padding: const EdgeInsets.symmetric(vertical: 12)
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
