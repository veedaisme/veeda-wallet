import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:clair_wallet/core/transaction_repository.dart';
import 'package:clair_wallet/core/di/transaction_providers.dart';

class AddTransactionModal extends ConsumerStatefulWidget {
  const AddTransactionModal({super.key});

  @override
  ConsumerState<AddTransactionModal> createState() => _AddTransactionModalState();
}

class _AddTransactionModalState extends ConsumerState<AddTransactionModal> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  TransactionCategory? _selectedCategory;
  DateTime _selectedDate = DateTime.now();

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

  void _saveTransaction() {
    if (_formKey.currentState!.validate()) {
      final amount = double.tryParse(_amountController.text);
      final note = _descriptionController.text;

      if (amount == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid amount.')),
        );
        return;
      }

      final categoryToSave = _selectedCategory ?? TransactionCategory.other;

      final newTransaction = Transaction()
        ..userId = 'user_placeholder'
        ..amount = amount
        ..note = note
        ..date = _selectedDate
        ..category = categoryToSave
        ..createdAt = DateTime.now()
        ..updatedAt = DateTime.now();
      
      ref.read(transactionRepositoryProvider).addTransaction(newTransaction);

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
                Text('Add Transaction', style: Theme.of(context).textTheme.titleLarge),
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
              value: _selectedCategory, // Bind to the state variable
              decoration: const InputDecoration(
                labelText: 'Category',
                border: OutlineInputBorder(), // Optional: adds a border like other TextFormFields
              ),
              hint: const Text('Select a category'), // Show a hint when no category is selected
              isExpanded: true, // Makes the dropdown take the full width
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
                setState(() {
                  _selectedCategory = newValue;
                });
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
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(LucideIcons.save),
                label: const Text('Save Transaction'),
                onPressed: _saveTransaction,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12)
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
