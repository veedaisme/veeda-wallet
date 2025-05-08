import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart'; 
import '../../core/di/transaction_providers.dart';
import '../../core/transaction_repository.dart'; 
// import '../../core/utils/currency.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:veeda_wallet/features/transactions/widgets/add_transaction_modal.dart'; // Corrected import path

double? getChange(double current, double previous) {
  if (previous == 0) return null;
  return ((current - previous) / previous) * 100;
}

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  void _showAddTransactionModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const AddTransactionModal(),
    );
  }

  void _showComparisonChart(BuildContext context, String title, Map<DateTime, double> currentData, Map<DateTime, double> previousData, String Function(DateTime) dateFormatter, DateTime startDate, bool isDaily) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true, 
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        final List<DateTime> currentKeys = currentData.keys.toList()..sort();
        final List<DateTime> previousKeys = previousData.keys.toList()..sort();

        final allDates = {...currentKeys, ...previousKeys}.toList()..sort(); 
        if (allDates.isEmpty) {
          return Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                const Text("No data available for chart."),
                const SizedBox(height: 16),
              ],
            ),
          );
        }

        final List<FlSpot> currentSpots = [];
        final List<FlSpot> previousSpots = [];

        // Determine a more visible color for the previous period line
        final previousLineColor = Theme.of(context).brightness == Brightness.dark 
                                  ? Colors.grey.shade700 
                                  : Colors.grey.shade500; // More visible grey for light theme

        for (int i = 0; i < allDates.length; i++) {
          final date = allDates[i];
          currentSpots.add(FlSpot(i.toDouble(), (currentData[date] ?? 0) / 1000));
          previousSpots.add(FlSpot(i.toDouble(), (previousData[date] ?? 0) / 1000));
        }
        
        double maxY = 0;
        if (currentSpots.isNotEmpty) {
          maxY = currentSpots.map((s) => s.y).reduce((a,b) => a > b ? a : b);
        }
        if (previousSpots.isNotEmpty) {
          final prevMaxY = previousSpots.map((s) => s.y).reduce((a,b) => a > b ? a : b);
          if (prevMaxY > maxY) maxY = prevMaxY;
        }
        if (maxY == 0) maxY = 5; 

        return Padding(
          padding: const EdgeInsets.all(16.0).copyWith(bottom: MediaQuery.of(context).viewInsets.bottom + 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildLegendItem(Theme.of(context).colorScheme.primary, 'This Period'),
                  const SizedBox(width: 16),
                  _buildLegendItem(Theme.of(context).colorScheme.secondary, 'Previous Period'),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                height: 250, 
                child: LineChart(
                  LineChartData(
                    lineBarsData: [
                      LineChartBarData(
                        spots: currentSpots,
                        isCurved: true,
                        color: Theme.of(context).colorScheme.primary,
                        barWidth: 3,
                        dotData: FlDotData(show: true),
                      ),
                      LineChartBarData(
                        spots: previousSpots,
                        isCurved: true,
                        color: previousLineColor, // Use the new more visible color
                        barWidth: 3,
                        dotData: FlDotData(show: true),
                      ),
                    ],
                    minY: 0,
                    maxY: maxY * 1.2, 
                    titlesData: FlTitlesData(
                      leftTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 45, 
                          getTitlesWidget: (value, meta) {
                            if (value == meta.max || value == meta.min) return const SizedBox.shrink(); 
                            return Text('${value.toInt()}K', style: const TextStyle(fontSize: 10));
                          },
                          interval: maxY > 0 ? (maxY / 4).ceilToDouble() : 1, 
                        ),
                      ),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 35, // Increased reserved size for bottom labels
                          getTitlesWidget: (value, meta) {
                            final idx = value.toInt();
                            if (idx < 0 || idx >= allDates.length) return const SizedBox.shrink();
                            final date = allDates[idx];
                            String label;
                            if (isDaily) {
                              label = dateFormatter(date); 
                            } else {
                              label = 'W${(date.day / 7).ceil()}';
                            }
                            if (allDates.length > 7 && idx % (allDates.length ~/ 5) != 0 && idx != allDates.length -1 && idx !=0) {
                              return const SizedBox.shrink();
                            }
                            return SideTitleWidget(axisSide: meta.axisSide, space: 4, child: Text(label, style: const TextStyle(fontSize: 9)));
                          },
                           interval: 1,
                        ),
                      ),
                      rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    ),
                    gridData: FlGridData(
                      show: true,
                      drawVerticalLine: true,
                      getDrawingHorizontalLine: (value) => FlLine(color: Theme.of(context).dividerColor.withOpacity(0.5), strokeWidth: 0.5),
                      getDrawingVerticalLine: (value) => FlLine(color: Theme.of(context).dividerColor.withOpacity(0.5), strokeWidth: 0.5),
                    ),
                    borderData: FlBorderData(show: true, border: Border.all(color: Theme.of(context).dividerColor, width: 1)),
                    lineTouchData: LineTouchData(
                       touchTooltipData: LineTouchTooltipData(
                         getTooltipItems: (touchedSpots) {
                           return touchedSpots.map((spot) {
                             final date = allDates[spot.spotIndex];
                             String label;
                             if (spot.barIndex == 0) label = 'This Period';
                             else label = 'Previous Period';

                             return LineTooltipItem(
                               '$label (${dateFormatter(date)}):\nRp ${(spot.y * 1000).toStringAsFixed(0)}',
                               TextStyle(color: spot.bar.color, fontWeight: FontWeight.bold, fontSize: 12),
                             );
                           }).toList();
                         }
                       )
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16), // Added some extra padding at the bottom of the modal content
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactionsAsyncValue = ref.watch(transactionListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        centerTitle: true,
      ),
      body: transactionsAsyncValue.when(
        data: (transactions) {
          final now = DateTime.now();
          final today = DateTime(now.year, now.month, now.day);
          final yesterday = today.subtract(const Duration(days: 1));

          final startOfThisWeek = today.subtract(Duration(days: today.weekday - 1));
          final endOfThisWeek = startOfThisWeek.add(const Duration(days: 6));
          final startOfLastWeek = startOfThisWeek.subtract(const Duration(days: 7));
          final endOfLastWeek = endOfThisWeek.subtract(const Duration(days: 7));

          final startOfThisMonth = DateTime(now.year, now.month, 1);
          final endOfThisMonth = DateTime(now.year, now.month + 1, 0);
          final startOfLastMonth = DateTime(now.year, now.month - 1, 1);
          final endOfLastMonth = DateTime(now.year, now.month, 0);

          double spentToday = 0;
          double spentYesterday = 0;
          double spentThisWeek = 0;
          double spentLastWeek = 0;
          double spentThisMonth = 0;
          double spentLastMonth = 0;

          Map<DateTime, double> getDailySpendingForPeriod(List<Transaction> txs, DateTime startDate, DateTime endDate) {
            final Map<DateTime, double> dailySpending = {};
            for (var i = 0; i <= endDate.difference(startDate).inDays; i++) {
              dailySpending[startDate.add(Duration(days: i))] = 0.0;
            }
            for (final tx in txs) {
              final txDate = DateTime(tx.date.year, tx.date.month, tx.date.day);
              if (!txDate.isBefore(startDate) && !txDate.isAfter(endDate)) {
                dailySpending[txDate] = (dailySpending[txDate] ?? 0) + tx.amount;
              }
            }
            return dailySpending;
          }

          Map<DateTime, double> getWeeklySpendingForMonth(List<Transaction> txs, DateTime startOfMonth, DateTime endOfMonth) {
            final Map<DateTime, double> weeklySpending = {};
            DateTime currentWeekStart = startOfMonth;
            while (currentWeekStart.isBefore(endOfMonth) || currentWeekStart.isAtSameMomentAs(endOfMonth)) {
              DateTime currentWeekEnd = currentWeekStart.add(const Duration(days: 6));
              if (currentWeekEnd.isAfter(endOfMonth)) {
                currentWeekEnd = endOfMonth;
              }
              double weekTotal = 0;
              for (final tx in txs) {
                if (!tx.date.isBefore(currentWeekStart) && !tx.date.isAfter(currentWeekEnd)) {
                  weekTotal += tx.amount;
                }
              }
              weeklySpending[currentWeekStart] = weekTotal;
              currentWeekStart = currentWeekStart.add(const Duration(days: 7));
            }
            return weeklySpending;
          }

          for (final tx in transactions) {
            final txDate = DateTime(tx.date.year, tx.date.month, tx.date.day);
            if (txDate.isAtSameMomentAs(today)) spentToday += tx.amount;
            if (txDate.isAtSameMomentAs(yesterday)) spentYesterday += tx.amount;
            if (!txDate.isBefore(startOfThisWeek) && !txDate.isAfter(endOfThisWeek)) spentThisWeek += tx.amount;
            if (!txDate.isBefore(startOfLastWeek) && !txDate.isAfter(endOfLastWeek)) spentLastWeek += tx.amount;
            if (!txDate.isBefore(startOfThisMonth) && !txDate.isAfter(endOfThisMonth)) spentThisMonth += tx.amount;
            if (!txDate.isBefore(startOfLastMonth) && !txDate.isAfter(endOfLastMonth)) spentLastMonth += tx.amount;
          }

          final dailySpendingThisWeek = getDailySpendingForPeriod(transactions, startOfThisWeek, endOfThisWeek);
          final dailySpendingLastWeek = getDailySpendingForPeriod(transactions, startOfLastWeek, endOfLastWeek);
          
          final weeklySpendingThisMonth = getWeeklySpendingForMonth(transactions, startOfThisMonth, endOfThisMonth);
          final weeklySpendingLastMonth = getWeeklySpendingForMonth(transactions, startOfLastMonth, endOfLastMonth);

          return RefreshIndicator(
            onRefresh: () => ref.refresh(transactionListProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                DashboardSummaryCard(
                  title: 'Today',
                  currentAmount: spentToday,
                  previousAmount: spentYesterday,
                  previousPeriodName: 'Yesterday',
                  // No chart for today's comparison
                ),
                const SizedBox(height: 16),
                DashboardSummaryCard(
                  title: 'This Week',
                  currentAmount: spentThisWeek,
                  previousAmount: spentLastWeek,
                  previousPeriodName: 'Last Week',
                  onTap: () => _showComparisonChart(
                    context,
                    'Weekly Spending Comparison',
                    dailySpendingThisWeek,
                    dailySpendingLastWeek,
                    (val) => DateFormat.E().format(val), // Format as day of week (Mon, Tue)
                    startOfThisWeek, // To determine x-axis labels correctly
                    true // isDaily
                  ),
                ),
                const SizedBox(height: 16),
                DashboardSummaryCard(
                  title: 'This Month',
                  currentAmount: spentThisMonth,
                  previousAmount: spentLastMonth,
                  previousPeriodName: 'Last Month',
                   onTap: () => _showComparisonChart(
                    context,
                    'Monthly Spending Comparison (by Week)',
                    weeklySpendingThisMonth,
                    weeklySpendingLastMonth,
                    (val) => 'W${(val.day / 7).ceil()}', // Format as Week number
                    startOfThisMonth,
                    false // isWeekly
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddTransactionModal(context),
        shape: const CircleBorder(), 
        child: const Icon(LucideIcons.plus),
        backgroundColor: Theme.of(context).colorScheme.primary,
      ),
    );
  }
}

class DashboardSummaryCard extends StatelessWidget {
  final String title;
  final double currentAmount;
  final double previousAmount;
  final String previousPeriodName;
  final VoidCallback? onTap;

  const DashboardSummaryCard({
    super.key,
    required this.title,
    required this.currentAmount,
    required this.previousAmount,
    required this.previousPeriodName,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final NumberFormat currencyFormatter = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor, 
        borderRadius: BorderRadius.circular(12.0), 
        border: Border.all(color: Theme.of(context).dividerColor, width: 1), 
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 6,
            offset: const Offset(0, 4), 
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2), 
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12.0),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleLarge),
                  if (onTap != null)
                    Icon(LucideIcons.chevronRight, color: Theme.of(context).hintColor),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                currencyFormatter.format(currentAmount),
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text(
                    '$previousPeriodName ${currencyFormatter.format(previousAmount)}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}

Widget _buildLegendItem(Color color, String label) {
  return Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 10,
        height: 10,
        color: color,
      ),
      const SizedBox(width: 4),
      Text(label, style: const TextStyle(fontSize: 12)),
    ],
  );
}