import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:veeda_wallet/core/transaction_repository.dart';
import 'package:veeda_wallet/core/ui/category_icons.dart'; // Import the new icon utility

class TransactionListItemCard extends StatelessWidget {
  final Transaction transaction;

  const TransactionListItemCard({super.key, required this.transaction});

  @override
  Widget build(BuildContext context) {
    final NumberFormat currencyFormatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );
    // Example date format, adjust as needed to match web
    final DateFormat dateFormatter = DateFormat('dd MMM yyyy, HH:mm');

    final categoryIcon = getLucideIconForCategory(transaction.category);
    final Color amountColor = transaction.amount >= 0 ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.error;

    return Card(
      elevation: 0.05, // A subtle shadow similar to shadow-sm
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12.0), // Corresponds to rounded-xl
        side: BorderSide(color: Theme.of(context).dividerColor.withOpacity(0.5), width: 1), // Corresponds to border border-gray-100
      ),
      margin: const EdgeInsets.symmetric(vertical: 6.0, horizontal: 0), // Like space-y-3
      child: Padding(
        padding: const EdgeInsets.all(12.0), // Corresponds to p-3
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10.0),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceVariant, // Similar to bg-gray-100
                shape: BoxShape.circle,
              ),
              child: Icon(categoryIcon, size: 24, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    transaction.note ?? 'No description',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    dateFormatter.format(transaction.date),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).hintColor),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              currencyFormatter.format(transaction.amount),
              style: Theme.of(context).textTheme.titleMedium?.copyWith(color: amountColor, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
