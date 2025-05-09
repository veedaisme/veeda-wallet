import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:veeda_wallet/features/transactions/widgets/add_transaction_modal.dart';

class AddTransactionFAB extends StatelessWidget {
  const AddTransactionFAB({super.key});

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: () {
        showModalBottomSheet(
          context: context,
          builder: (BuildContext context) {
            return const AddTransactionModal();
          },
          isScrollControlled: true, 
          shape: const CircleBorder(),
        );
      },
      child: const Icon(LucideIcons.plus),
      // You can add consistent styling here if needed, e.g.:
      // backgroundColor: Theme.of(context).colorScheme.primary,
      // foregroundColor: Theme.of(context).colorScheme.onPrimary,
      // tooltip: 'Add Transaction',
    );
  }
}
