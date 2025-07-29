import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DatePickerInput } from '@/components/ui/DatePickerInput'
import { useAuth } from '@/hooks/useAuth'
import { useTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/queries/useTransactions'
import { useHaptics } from '@/hooks/useHaptics'
import { useAppStore } from '@/stores/appStore'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { getCategoryIcon, getCategoryColor } from '@/constants/Categories'
import { TRANSACTION_CATEGORIES } from '@/types/transaction'

const transactionSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().min(1, 'Category is required'),
  note: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
})

type TransactionFormData = z.infer<typeof transactionSchema>

export default function EditTransactionModal() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { user } = useAuth()
  const { editingTransactionId, setEditingTransactionId } = useAppStore()
  const updateTransactionMutation = useUpdateTransaction()
  const deleteTransactionMutation = useDeleteTransaction()
  const { onSuccess, onError } = useHaptics()
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  // Fetch the transaction to edit
  const { data: transaction, isLoading: isLoadingTransaction } = useTransaction(editingTransactionId || '')

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange',
    defaultValues: {
      amount: '',
      category: '',
      note: '',
      date: new Date().toISOString().split('T')[0],
    },
  })

  // Populate form when transaction data is loaded
  useEffect(() => {
    if (transaction) {
      setValue('amount', transaction.amount.toString())
      setValue('category', transaction.category)
      setValue('note', transaction.note || '')
      setValue('date', transaction.date.split('T')[0])
      setSelectedCategory(transaction.category)
    }
  }, [transaction, setValue])

  const onSubmit = async (data: TransactionFormData) => {
    if (!user || !editingTransactionId) {
      Alert.alert('Error', 'Transaction ID not found.')
      return
    }

    try {
      await updateTransactionMutation.mutateAsync({
        id: editingTransactionId,
        transactionData: {
          amount: parseFloat(data.amount),
          category: data.category,
          note: data.note || null,
          date: data.date,
        },
      })
      
      onSuccess()
      Alert.alert(
        'Success', 
        'Transaction updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setEditingTransactionId(null)
              router.back()
            }
          }
        ]
      )
    } catch (error) {
      onError()
      Alert.alert('Error', 'Failed to update transaction. Please try again.')
    }
  }

  const handleDelete = () => {
    if (!editingTransactionId) return

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransactionMutation.mutateAsync(editingTransactionId)
              onSuccess()
              Alert.alert(
                'Success',
                'Transaction deleted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setEditingTransactionId(null)
                      router.back()
                    }
                  }
                ]
              )
            } catch (error) {
              onError()
              Alert.alert('Error', 'Failed to delete transaction. Please try again.')
            }
          },
        },
      ]
    )
  }

  const isLoading = isSubmitting || updateTransactionMutation.isPending || deleteTransactionMutation.isPending

  if (isLoadingTransaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading transaction...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Transaction not found
          </Text>
          <Button
            title="Go Back"
            onPress={() => {
              setEditingTransactionId(null)
              router.back()
            }}
          />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.formCard}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                Edit Transaction
              </Text>
              <Button
                title="Delete"
                variant="outline"
                size="small"
                onPress={handleDelete}
                loading={deleteTransactionMutation.isPending}
                leftIcon={
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                }
                style={[styles.deleteButton, { borderColor: colors.error }]}
                textStyle={{ color: colors.error }}
              />
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Amount (IDR)"
                    placeholder="0"
                    value={value}
                    onChangeText={onChange}
                    error={errors.amount?.message}
                    success={!errors.amount && value && value.length > 0}
                    keyboardType="numeric"
                    leftIcon={
                      <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>
                        Rp
                      </Text>
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="category"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Input
                      label="Category"
                      placeholder="Select category"
                      value={value}
                      onChangeText={onChange}
                      error={errors.category?.message}
                      success={!errors.category && value && value.length > 0}
                      editable={false}
                      leftIcon={
                        <Ionicons 
                          name="folder-outline" 
                          size={20} 
                          color={colors.icon} 
                        />
                      }
                    />

                    <View style={styles.categoryGrid}>
                      {TRANSACTION_CATEGORIES.map((category) => (
                        <Button
                          key={category}
                          title={category}
                          variant={value === category ? 'primary' : 'outline'}
                          size="small"
                          onPress={() => {
                            setSelectedCategory(category)
                            onChange(category)
                          }}
                          leftIcon={
                            <Text style={styles.categoryButtonIcon}>
                              {getCategoryIcon(category)}
                            </Text>
                          }
                          style={[
                            styles.categoryButton,
                            value === category && {
                              backgroundColor: getCategoryColor(category) + '20',
                              borderColor: getCategoryColor(category),
                            }
                          ]}
                        />
                      ))}
                    </View>
                  </>
                )}
              />

              <Controller
                control={control}
                name="note"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Note (Optional)"
                    placeholder="Add a note..."
                    value={value}
                    onChangeText={onChange}
                    error={errors.note?.message}
                    multiline
                    numberOfLines={3}
                    leftIcon={
                      <Ionicons 
                        name="document-text-outline" 
                        size={20} 
                        color={colors.icon} 
                      />
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="date"
                render={({ field: { onChange, value } }) => (
                  <DatePickerInput
                    label="Date"
                    value={value}
                    onChange={onChange}
                    error={errors.date?.message}
                    success={!errors.date && value && value.length > 0}
                  />
                )}
              />

              <View style={styles.buttonContainer}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => {
                    setEditingTransactionId(null)
                    router.back()
                  }}
                  style={styles.cancelButton}
                />
                <Button
                  title="Update Transaction"
                  onPress={handleSubmit(onSubmit)}
                  loading={isLoading}
                  style={styles.updateButton}
                />
              </View>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  formCard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  deleteButton: {
    minWidth: 80,
  },
  form: {
    gap: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  categoryButton: {
    minWidth: 100,
  },
  categoryButtonIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  updateButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
})