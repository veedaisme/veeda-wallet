import React, { useState, useEffect } from 'react'
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
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, subMonths, isSameMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { formatCurrency } from '@/lib/utils'

const screenWidth = Dimensions.get('window').width

interface ChartModalProps {
  visible: boolean
  onClose: () => void
  title: string
  type: 'week' | 'month'
  data: {
    current: number
    previous: number
    change: number
  }
  userId: string | null
}

export function ChartModal({ visible, onClose, title, type, data, userId }: ChartModalProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<Array<Record<string, unknown>>>([])

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

  useEffect(() => {
    if (!visible || !type || !userId) return
    setLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        const now = new Date()
        if (type === 'week') {
          const startCurrent = startOfWeek(now, { weekStartsOn: 1 })
          const endCurrent = addDays(startCurrent, 6)
          const startPrev = addDays(startCurrent, -7)
          const endPrev = addDays(startPrev, 6)

          const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startPrev.toISOString())
            .lte('date', endCurrent.toISOString())

          if (error) {
            setError('Failed to fetch transactions')
            setLoading(false)
            return
          }

          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
          const currentWeek: Record<string, number> = {}
          const previousWeek: Record<string, number> = {}
          days.forEach(day => {
            currentWeek[day] = 0
            previousWeek[day] = 0
          })

          transactions?.forEach(tx => {
            const d = new Date(tx.date)
            if (d >= startCurrent && d <= endCurrent) {
              const label = format(d, 'EEE')
              if (label in currentWeek) currentWeek[label] += tx.amount
            } else if (d >= startPrev && d <= endPrev) {
              const label = format(d, 'EEE')
              if (label in previousWeek) previousWeek[label] += tx.amount
            }
          })

          setChartData(
            days.map(day => ({
              name: day,
              current: currentWeek[day] || 0,
              previous: previousWeek[day] || 0,
            }))
          )
        } else if (type === 'month') {
          const startCurrent = startOfMonth(now)
          const endCurrent = endOfMonth(now)
          const prevMonth = subMonths(now, 1)
          const startPrev = startOfMonth(prevMonth)
          const endPrev = endOfMonth(prevMonth)

          const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startPrev.toISOString())
            .lte('date', endCurrent.toISOString())

          if (error) {
            setError('Failed to fetch transactions')
            setLoading(false)
            return
          }

          // Simple week grouping
          const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
          const currentMonth: Record<string, number> = {}
          const previousMonth: Record<string, number> = {}
          weeks.forEach(week => {
            currentMonth[week] = 0
            previousMonth[week] = 0
          })

          transactions?.forEach(tx => {
            const d = new Date(tx.date)
            const weekNum = Math.ceil(d.getDate() / 7)
            const weekKey = `Week ${Math.min(weekNum, 4)}`
            
            if (isSameMonth(d, startCurrent)) {
              currentMonth[weekKey] += tx.amount
            } else if (isSameMonth(d, startPrev)) {
              previousMonth[weekKey] += tx.amount
            }
          })

          setChartData(
            weeks.map(week => ({
              name: week,
              current: currentMonth[week] || 0,
              previous: previousMonth[week] || 0,
            }))
          )
        }
        setLoading(false)
      } catch (err) {
        setError('Failed to load chart data')
        setLoading(false)
      }
    }

    fetchData()
  }, [visible, type, userId])

  const renderChart = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading chart data...
          </Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      )
    }

    if (chartData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: colors.textMuted }]}>
            No data available
          </Text>
        </View>
      )
    }

    if (type === 'week') {
      return renderWeeklyChart()
    } else if (type === 'month') {
      return renderMonthlyChart()
    }
    return null
  }


  const renderWeeklyChart = () => {
    const weeklyData = {
      labels: chartData.map(item => item.name as string),
      datasets: [
        {
          data: chartData.map(item => (item.current as number) || 0),
          color: (opacity = 1) => colors.primary,
          strokeWidth: 3,
        },
        {
          data: chartData.map(item => (item.previous as number) || 0),
          color: (opacity = 1) => colors.textMuted,
          strokeWidth: 2,
        },
      ],
      legend: ['This Week', 'Last Week'],
    }

    return (
      <LineChart
        data={weeklyData}
        width={screenWidth - 48}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    )
  }

  const renderMonthlyChart = () => {
    const monthlyData = {
      labels: chartData.map(item => item.name as string),
      datasets: [
        {
          data: chartData.map(item => (item.current as number) || 0),
          color: (opacity = 1) => colors.primary,
          strokeWidth: 3,
        },
        {
          data: chartData.map(item => (item.previous as number) || 0),
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
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
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