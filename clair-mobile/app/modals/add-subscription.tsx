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
import { useAuth } from '@/hooks/useAuth'
import { useCreateSubscription } from '@/hooks/queries/useSubscriptions'
import { useHaptics } from '@/hooks/useHaptics'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { COMMON_CURRENCIES, FREQUENCIES } from '@/types/subscription'

const subscriptionSchema = z.object({
  provider_name: z.string().min(1, 'Provider name is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().min(1, 'Currency is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  payment_date: z.string().min(1, 'Payment date is required'),
})

type SubscriptionFormData = z.infer<typeof subscriptionSchema>

export default function AddSubscriptionModal() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { user } = useAuth()
  const createSubscriptionMutation = useCreateSubscription()
  const { onSuccess, onError } = useHaptics()
  const [selectedCurrency, setSelectedCurrency] = useState<string>('IDR')
  const [selectedFrequency, setSelectedFrequency] = useState<string>('')

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      provider_name: '',
      amount: '',
      currency: 'IDR',
      frequency: '',
      payment_date: new Date().toISOString().split('T')[0],
    },
  })

  const onSubmit = async (data: SubscriptionFormData) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add a subscription.')
      return
    }

    try {
      await createSubscriptionMutation.mutateAsync({
        userId: user.id,
        subscriptionData: {
          provider_name: data.provider_name,
          amount: parseFloat(data.amount),
          currency: data.currency,
          frequency: data.frequency as any,
          payment_date: data.payment_date,
        },
      })
      
      onSuccess()
      router.back()
    } catch (error) {
      onError()
      Alert.alert('Error', 'Failed to add subscription. Please try again.')
    }
  }

  const isLoading = isSubmitting || createSubscriptionMutation.isPending

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
                name="provider_name"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Provider Name"
                    placeholder="e.g., Netflix, Spotify, Adobe"
                    value={value}
                    onChangeText={onChange}
                    error={errors.provider_name?.message}
                    leftIcon={
                      <Ionicons 
                        name="business-outline" 
                        size={20} 
                        color={colors.icon} 
                      />
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Amount"
                    placeholder="0.00"
                    value={value}
                    onChangeText={onChange}
                    error={errors.amount?.message}
                    keyboardType="numeric"
                    leftIcon={
                      <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>
                        {selectedCurrency === 'IDR' ? 'Rp' : selectedCurrency}
                      </Text>
                    }
                  />
                )}
              />

              <Text style={[styles.sectionTitle, { color: colors.text }]}>Currency</Text>
              <View style={styles.currencyGrid}>
                {COMMON_CURRENCIES.map((currency) => (
                  <Button
                    key={currency}
                    title={currency}
                    variant={selectedCurrency === currency ? 'primary' : 'outline'}
                    size="small"
                    onPress={() => {
                      setSelectedCurrency(currency)
                      setValue('currency', currency)
                    }}
                    style={styles.optionButton}
                  />
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequency</Text>
              <View style={styles.frequencyGrid}>
                {FREQUENCIES.map((frequency) => (
                  <Button
                    key={frequency}
                    title={frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                    variant={selectedFrequency === frequency ? 'primary' : 'outline'}
                    size="small"
                    onPress={() => {
                      setSelectedFrequency(frequency)
                      setValue('frequency', frequency)
                    }}
                    style={styles.optionButton}
                  />
                ))}
              </View>

              <Controller
                control={control}
                name="payment_date"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Next Payment Date"
                    placeholder="YYYY-MM-DD"
                    value={value}
                    onChangeText={onChange}
                    error={errors.payment_date?.message}
                    leftIcon={
                      <Ionicons 
                        name="calendar-outline" 
                        size={20} 
                        color={colors.icon} 
                      />
                    }
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
                  title="Add Subscription"
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  frequencyGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  optionButton: {
    minWidth: 80,
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