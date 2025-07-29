import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuthV2'
import { useHaptics } from '@/hooks/useHaptics'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { signUp, isLoading: authLoading } = useAuth()
  const { onError, onSuccess } = useHaptics()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsSigningUp(true)
    try {
      const result = await signUp({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      })
      
      if (result.success) {
        onSuccess()
        Alert.alert(
          'Registration Successful',
          'Please check your email for verification instructions.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        )
      } else {
        onError()
        Alert.alert(
          'Registration Failed', 
          result.error?.message || 'Unable to create account. Please try again.'
        )
      }
    } catch (error) {
      onError()
      Alert.alert('Registration Failed', 'An unexpected error occurred')
    } finally {
      setIsSigningUp(false)
    }
  }

  const isLoading = authLoading || isSubmitting || isSigningUp

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
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join Clair Wallet to start managing your finances
            </Text>
          </View>

          <Card style={styles.formCard}>
            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    value={value}
                    onChangeText={onChange}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    leftIcon={
                      <Ionicons 
                        name="mail-outline" 
                        size={20} 
                        color={colors.icon} 
                      />
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Create a password"
                    value={value}
                    onChangeText={onChange}
                    error={errors.password?.message}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    leftIcon={
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={20} 
                        color={colors.icon} 
                      />
                    }
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={colors.icon}
                        />
                      </TouchableOpacity>
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    value={value}
                    onChangeText={onChange}
                    error={errors.confirmPassword?.message}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    leftIcon={
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={20} 
                        color={colors.icon} 
                      />
                    }
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={colors.icon}
                        />
                      </TouchableOpacity>
                    }
                  />
                )}
              />

              <View style={styles.passwordHint}>
                <Text style={[styles.passwordHintText, { color: colors.textMuted }]}>
                  Password must be at least 6 characters long
                </Text>
              </View>

              <Button
                title="Create Account"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                style={styles.createAccountButton}
              />

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                  Already have an account?
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
              </View>

              <Link href="/(auth)/login" asChild>
                <Button
                  title="Sign In"
                  variant="outline"
                  style={styles.signInButton}
                />
              </Link>
            </View>
          </Card>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  formCard: {
    marginBottom: 24,
  },
  form: {
    gap: 8,
  },
  passwordHint: {
    marginBottom: 8,
  },
  passwordHintText: {
    fontSize: 12,
    lineHeight: 16,
  },
  createAccountButton: {
    marginTop: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    paddingHorizontal: 8,
  },
  signInButton: {
    marginBottom: 8,
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
})