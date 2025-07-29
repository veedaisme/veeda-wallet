import React, { useState } from 'react'
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
import { useCreateTransaction } from '@/hooks/queries/useTransactions'
import { useHaptics } from '@/hooks/useHaptics'
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

export default function AddTransactionModal() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { user } = useAuth()
  const createTransactionMutation = useCreateTransaction()
  const { onSuccess, onError } = useHaptics()
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      amount: '',
      category: '',
      note: '',
      date: new Date().toISOString().split('T')[0],
    },
  })

  // Watch form values for validation feedback
  const watchedValues = watch()

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add a transaction.')
      return
    }

    try {
      await createTransactionMutation.mutateAsync({
        userId: user.id,
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
        'Transaction added successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      )
    } catch (error) {
      onError()
      Alert.alert('Error', 'Failed to add transaction. Please try again.')
    }
  }

  const isLoading = isSubmitting || createTransactionMutation.isPending

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
                            onChange(category) // Fix: Update form value
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
                  onPress={() => router.back()}
                  style={styles.cancelButton}
                />
                <Button
                  title="Add Transaction"
                  onPress={handleSubmit(onSubmit)}
                  loading={isLoading}
                  style={styles.addButton}
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
  addButton: {
    flex: 1,
  },
})