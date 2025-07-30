import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { useAuth } from '@/hooks/useAuthV2'
import { useCreateTransaction } from '@/hooks/queries/useTransactions'
import { useHaptics } from '@/hooks/useHaptics'
import { TRANSACTION_CATEGORIES, type TransactionCategory } from '@/types/transaction'

const QUICK_CATEGORIES: TransactionCategory[] = ['Food', 'Transportation', 'Shopping', 'Entertainment']

export function QuickExpenseEntry() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { user } = useAuth()
  const { onSuccess, onError } = useHaptics()
  
  const [amount, setAmount] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('Food')
  const [isExpanded, setIsExpanded] = useState(false)
  
  const createTransactionMutation = useCreateTransaction()

  const handleQuickAdd = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add a transaction.')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.')
      return
    }

    try {
      await createTransactionMutation.mutateAsync({
        userId: user.id,
        transactionData: {
          amount: parseFloat(amount),
          category: selectedCategory,
          note: `Quick entry - ${selectedCategory}`,
          date: new Date().toISOString().split('T')[0],
        },
      })
      
      onSuccess()
      setAmount('')
      setIsExpanded(false)
      Alert.alert('Success', 'Transaction added successfully!')
    } catch (error) {
      onError()
      Alert.alert('Error', 'Failed to add transaction. Please try again.')
    }
  }

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    if (!numericValue) return ''
    
    return new Intl.NumberFormat('id-ID').format(parseInt(numericValue))
  }

  if (!isExpanded) {
    return (
      <Card style={styles.container}>
        <Pressable 
          style={styles.expandButton}
          onPress={() => setIsExpanded(true)}
        >
          <View style={styles.expandButtonContent}>
            <Ionicons 
              name="add-circle-outline" 
              size={20} 
              color={colors.primary} 
            />
            <Text style={[styles.expandButtonText, { color: colors.primary }]}>
              Quick Add Expense
            </Text>
          </View>
          <Ionicons 
            name="chevron-down-outline" 
            size={16} 
            color={colors.textSecondary} 
          />
        </Pressable>
      </Card>
    )
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flash-outline" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Quick Add Expense
          </Text>
        </View>
        <Pressable 
          onPress={() => setIsExpanded(false)}
          style={styles.collapseButton}
        >
          <Ionicons 
            name="chevron-up-outline" 
            size={16} 
            color={colors.textSecondary} 
          />
        </Pressable>
      </View>

      <View style={styles.form}>
        <Input
          label="Amount (IDR)"
          placeholder="0"
          value={amount}
          onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          leftIcon={
            <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>
              Rp
            </Text>
          }
          rightIcon={
            amount ? (
              <Text style={[styles.formattedAmount, { color: colors.textSecondary }]}>
                {formatCurrency(amount)}
              </Text>
            ) : undefined
          }
        />

        <View style={styles.categorySection}>
          <Text style={[styles.categoryLabel, { color: colors.text }]}>
            Category
          </Text>
          <View style={styles.categoryGrid}>
            {QUICK_CATEGORIES.map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: selectedCategory === category 
                      ? colors.primary 
                      : colors.background,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  {
                    color: selectedCategory === category 
                      ? colors.background 
                      : colors.text
                  }
                ]}>
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => {
              setAmount('')
              setIsExpanded(false)
            }}
            style={styles.cancelButton}
          />
          <Button
            title="Add"
            onPress={handleQuickAdd}
            loading={createTransactionMutation.isPending}
            style={styles.addButton}
          />
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  expandButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  collapseButton: {
    padding: 4,
  },
  form: {
    gap: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
  },
  formattedAmount: {
    fontSize: 12,
  },
  categorySection: {
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
  },
})