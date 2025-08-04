import React, { useEffect, forwardRef, useImperativeHandle, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Ionicons } from '@expo/vector-icons'

import { BottomSheet } from '@/components/ui/BottomSheet'
import { useBottomSheet } from '@/hooks/useBottomSheet'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DatePickerInput } from '@/components/ui/DatePickerInput'
import { CategoryDropdown } from '@/components/ui/CategoryDropdown'
import { useAuth } from '@/hooks/useAuthV2'
import { 
  useTransaction, 
  useCreateTransaction, 
  useUpdateTransaction 
} from '@/hooks/queries/useTransactions'
import { useHaptics } from '@/hooks/useHaptics'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

const transactionSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().min(1, 'Category is required'),
  note: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
})

type TransactionFormData = z.infer<typeof transactionSchema>

export interface TransactionBottomSheetMethods {
  openAddTransaction: () => void
  openEditTransaction: (transactionId: string) => void
  close: () => void
}

interface TransactionBottomSheetProps {
  // No props needed - controlled via ref
}

export const TransactionBottomSheet = forwardRef<TransactionBottomSheetMethods, TransactionBottomSheetProps>((props, ref) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { user } = useAuth()
  const { 
    onSuccess, 
    onError, 
    onNavigation, 
    onButtonPress, 
    onFormSubmit,
    triggerLight 
  } = useHaptics()

  // Bottom sheet state
  const {
    bottomSheetRef,
    isOpen,
    open,
    close,
    onOpen,
    onClose: handleClose,
  } = useBottomSheet()

  // Form state
  const [mode, setMode] = React.useState<'add' | 'edit'>('add')
  const [editTransactionId, setEditTransactionId] = React.useState<string | null>(null)

  // Mutations
  const createTransactionMutation = useCreateTransaction()
  const updateTransactionMutation = useUpdateTransaction()

  // Fetch transaction for edit mode
  const { data: transaction, isLoading: isLoadingTransaction } = useTransaction(
    editTransactionId || '',
    { enabled: mode === 'edit' && !!editTransactionId }
  )

  const {
    control,
    handleSubmit,
    setValue,
    reset,
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

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    openAddTransaction: () => {
      onNavigation()
      setMode('add')
      setEditTransactionId(null)
      reset({
        amount: '',
        category: '',
        note: '',
        date: new Date().toISOString().split('T')[0],
      })
      open()
    },
    openEditTransaction: (transactionId: string) => {
      onNavigation()
      setMode('edit')
      setEditTransactionId(transactionId)
      open()
    },
    close: () => {
      triggerLight()
      close()
    },
  }), [open, close, reset, onNavigation, triggerLight])

  // Reset form when sheet opens for add mode
  useEffect(() => {
    if (isOpen && mode === 'add') {
      reset({
        amount: '',
        category: '',
        note: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
  }, [isOpen, mode, reset])

  // Populate form for edit mode
  useEffect(() => {
    if (transaction && mode === 'edit') {
      setValue('amount', transaction.amount.toString())
      setValue('category', transaction.category)
      setValue('note', transaction.note || '')
      setValue('date', transaction.date.split('T')[0])
    }
  }, [transaction, mode, setValue])

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in.')
      return
    }

    onFormSubmit()
    
    try {
      if (mode === 'add') {
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
        Alert.alert('Success', 'Transaction added successfully!')
      } else if (mode === 'edit' && editTransactionId) {
        await updateTransactionMutation.mutateAsync({
          id: editTransactionId,
          transactionData: {
            amount: parseFloat(data.amount),
            category: data.category,
            note: data.note || null,
            date: data.date,
          },
        })
        
        onSuccess()
        Alert.alert('Success', 'Transaction updated successfully!')
      }
      
      close()
    } catch (error) {
      onError()
      Alert.alert('Error', `Failed to ${mode} transaction. Please try again.`)
    }
  }

  const handleCloseSheet = () => {
    triggerLight()
    // Reset form state when closing
    setEditTransactionId(null)
    handleClose()
  }

  const isLoading = isSubmitting || 
    createTransactionMutation.isPending || 
    updateTransactionMutation.isPending



  return (
    <BottomSheet
      ref={bottomSheetRef}
      enableDynamicSizing={true}
      enableBackdropDismiss={true}
      enableSwipeToDismiss={true}
      onOpen={onOpen}
      onClose={handleCloseSheet}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {mode === 'add' ? 'Add Transaction' : 'Edit Transaction'}
          </Text>
        </View>

        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* Amount Field */}
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

            {/* Category Dropdown */}
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <CategoryDropdown
                  value={value}
                  onSelect={onChange}
                  error={errors.category?.message}
                  placeholder="Select a category"
                />
              )}
            />

            {/* Note Field */}
            <Controller
              control={control}
              name="note"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Note (Optional)"
                  placeholder="Coffee, lunch, etc."
                  value={value}
                  onChangeText={onChange}
                  error={errors.note?.message}
                  multiline
                  numberOfLines={2}
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

            {/* Date Field */}
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

            {/* Action Buttons - Moved inside scroll view */}
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  onButtonPress()
                  close()
                }}
                style={styles.cancelButton}
              />
              <Button
                title={mode === 'add' ? 'Save' : 'Update'}
                onPress={() => {
                  onButtonPress()
                  handleSubmit(onSubmit)()
                }}
                loading={isLoading}
                style={styles.submitButton}
              />
            </View>
          </View>
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  )
})

TransactionBottomSheet.displayName = 'TransactionBottomSheet'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  form: {
    gap: 0, // Remove gap since Input component has its own margin
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    paddingBottom: 8, // Reduced bottom padding since it's in scroll view
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
})