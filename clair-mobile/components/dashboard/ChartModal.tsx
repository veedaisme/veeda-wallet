import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LineChart, BarChart } from 'react-native-chart-kit'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { formatCurrency } from '@/lib/utils'

const screenWidth = Dimensions.get('window').width

interface ChartModalProps {
  visible: boolean
  onClose: () => void
  title: string
  type: 'today' | 'week' | 'month'
  data: any
}

export function ChartModal({ visible, onClose, title, type, data }: ChartModalProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: colors.border,
    },
  }

  const renderChart = () => {
    switch (type) {
      case 'today':
        return renderHourlyChart()
      case 'week':
        return renderWeeklyChart()
      case 'month':
        return renderMonthlyChart()
      default:
        return null
    }
  }

  const renderHourlyChart = () => {
    // Mock hourly data for today vs yesterday
    const hourlyData = {
      labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
      datasets: [
        {
          data: [0, 50000, 120000, 80000, 200000, 150000],
          color: (opacity = 1) => colors.primary,
          strokeWidth: 2,
        },
        {
          data: [0, 30000, 100000, 60000, 180000, 120000],
          color: (opacity = 1) => colors.textMuted,
          strokeWidth: 2,
        },
      ],
      legend: ['Today', 'Yesterday'],
    }

    return (
      <LineChart
        data={hourlyData}
        width={screenWidth - 48}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    )
  }

  const renderWeeklyChart = () => {
    // Mock daily data for this week vs last week
    const weeklyData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          data: [150000, 200000, 180000, 220000, 300000, 250000, 180000],
        },
      ],
    }

    return (
      <BarChart
        data={weeklyData}
        width={screenWidth - 48}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={chartConfig}
        style={styles.chart}
      />
    )
  }

  const renderMonthlyChart = () => {
    // Mock weekly data for this month vs last month
    const monthlyData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          data: [1200000, 1500000, 1800000, 1600000],
          color: (opacity = 1) => colors.primary,
          strokeWidth: 3,
        },
        {
          data: [1000000, 1300000, 1400000, 1200000],
          color: (opacity = 1) => colors.textMuted,
          strokeWidth: 3,
        },
      ],
      legend: ['This Month', 'Last Month'],
    }

    return (
      <LineChart
        data={monthlyData}
        width={screenWidth - 48}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {title} Breakdown
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.content}>
          {/* Chart */}
          <View style={styles.chartContainer}>
            {renderChart()}
          </View>

          {/* Summary Stats */}
          <View style={styles.summaryContainer}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              Summary
            </Text>
            
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Current Period
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatCurrency(data?.current || 0)}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Previous Period
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatCurrency(data?.previous || 0)}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Change
              </Text>
              <View style={styles.changeContainer}>
                <Ionicons
                  name={data?.change >= 0 ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={data?.change >= 0 ? colors.error : colors.success}
                />
                <Text style={[
                  styles.changeValue,
                  { color: data?.change >= 0 ? colors.error : colors.success }
                ]}>
                  {data?.change >= 0 ? '+' : ''}{data?.change?.toFixed(1) || 0}%
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60, // Account for status bar
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingBottom: 32,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  summaryContainer: {
    paddingHorizontal: 24,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
})