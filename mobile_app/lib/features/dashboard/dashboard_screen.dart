import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/di/transaction_providers.dart';
import '../../core/transaction_repository.dart';
import '../../core/utils/currency.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactions = ref.watch(transactionListProvider);

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final startOfWeek = today.subtract(Duration(days: today.weekday - 1));
    final startOfMonth = DateTime(now.year, now.month, 1);

    double spentToday = 0;
    double spentThisWeek = 0;
    double spentThisMonth = 0;

    // For chart: daily spending for the last 7 days
    final Map<DateTime, double> dailySpending = {};

    for (int i = 6; i >= 0; i--) {
      final day = today.subtract(Duration(days: i));
      dailySpending[day] = 0;
    }

    for (final tx in transactions) {
      final txDate = DateTime(tx.date.year, tx.date.month, tx.date.day);
      if (txDate == today) {
        spentToday += tx.amount;
      }
      if (txDate.isAfter(startOfWeek.subtract(const Duration(days: 1)))) {
        spentThisWeek += tx.amount;
      }
      if (txDate.isAfter(startOfMonth.subtract(const Duration(days: 1)))) {
        spentThisMonth += tx.amount;
      }
      if (dailySpending.containsKey(txDate)) {
        dailySpending[txDate] = (dailySpending[txDate] ?? 0) + tx.amount;
      }
    }

    void showComparisonChart() {
      showModalBottomSheet(
        context: context,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        builder: (context) {
          final days = dailySpending.keys.toList()..sort();
          final spots = List.generate(
            days.length,
            (i) => FlSpot(
              i.toDouble(),
              (dailySpending[days[i]] ?? 0) / 1000, // Use 'K' for thousands
            ),
          );
          return Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Spending (Last 7 Days)',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  height: 200,
                  child: LineChart(
                    LineChartData(
                      lineBarsData: [
                        LineChartBarData(
                          spots: spots,
                          isCurved: true,
                          color: Colors.indigo,
                          barWidth: 3,
                          dotData: FlDotData(show: true),
                        ),
                      ],
                      minY: 0,
                      titlesData: FlTitlesData(
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 40,
                            getTitlesWidget: (value, meta) {
                              if (value == 0) return const Text('0');
                              return Text('${value.toInt() * 1000 ~/ 1000}K');
                            },
                          ),
                        ),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) {
                              final idx = value.toInt();
                              if (idx < 0 || idx >= days.length) return const SizedBox.shrink();
                              final day = days[idx];
                              return Text(
                                '${day.month}/${day.day}',
                                style: const TextStyle(fontSize: 10),
                              );
                            },
                          ),
                        ),
                        rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      gridData: FlGridData(show: true),
                      borderData: FlBorderData(show: false),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            DashboardSummaryCard(
              title: 'Spent Today',
              amount: spentToday,
              onTap: showComparisonChart,
            ),
            const SizedBox(height: 16),
            DashboardSummaryCard(
              title: 'Spent This Week',
              amount: spentThisWeek,
              onTap: showComparisonChart,
            ),
            const SizedBox(height: 16),
            DashboardSummaryCard(
              title: 'Spent This Month',
              amount: spentThisMonth,
              onTap: showComparisonChart,
            ),
          ],
        ),
      ),
    );
  }
}

class DashboardSummaryCard extends StatelessWidget {
  final String title;
  final double amount;
  final VoidCallback onTap;

  const DashboardSummaryCard({
    super.key,
    required this.title,
    required this.amount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              Text(
                formatRupiah(amount),
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ),
    );
  }
}