import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import type { SpendingAnalytics } from '@/hooks/queries/useDashboard'

interface SpendingChartProps {
  analytics: SpendingAnalytics | undefined
}

const screenWidth = Dimensions.get('window').width

export function SpendingChart({ analytics }: SpendingChartProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  if (!analytics) {
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No spending data available
        </Text>
      </View>
    )
  }

  // Prepare chart data - showing weekly comparison
  const chartData = {
    labels: ['Last Week', 'This Week'],
    datasets: [
      {
        data: [analytics.lastWeek || 0, analytics.thisWeek || 0],
        color: (opacity = 1) => colors.primary + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
        strokeWidth: 3,
      },
    ],
  }

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
    labelColor: (opacity = 1) => colors.text + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // solid lines
      stroke: colors.border,
    },
    propsForLabels: {
      fontSize: 12,
    },
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Weekly Spending Trend
        </Text>
        <Text style={[
          styles.comparison,
          {
            color: analytics.weeklyComparison >= 0 ? colors.error : colors.success
          }
        ]}>
          {analytics.weeklyComparison >= 0 ? '+' : ''}
          {analytics.weeklyComparison.toFixed(1)}%
        </Text>
      </View>
      
      <LineChart
        data={chartData}
        width={screenWidth - 48} // padding
        height={200}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        formatYLabel={(value) => formatCurrency(parseFloat(value)).replace('Rp', '').trim()}
        withVerticalLabels
        withHorizontalLabels
        withDots
        withShadow={false}
        withVerticalLines={false}
        withHorizontalLines
        segments={4}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  comparison: {
    fontSize: 14,
    fontWeight: '500',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  emptyText: {
    fontSize: 14,
  },
})