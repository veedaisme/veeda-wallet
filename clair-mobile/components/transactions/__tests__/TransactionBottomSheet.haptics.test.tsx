import React from 'react'
import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransactionBottomSheet } from '../TransactionBottomSheet'
import { useHaptics } from '@/hooks/useHaptics'

// Mock useHaptics hook
jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: jest.fn(),
}))

// Mock other dependencies
jest.mock('@/hooks/useAuthV2', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))

jest.mock('@/hooks/queries/useTransactions', () => ({
  useTransaction: () => ({ data: null, isLoading: false }),
  useCreateTransaction: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useUpdateTransaction: () => ({ mutateAsync: jest.fn(), isPending: false }),
}))

const mockHaptics = {
  onSuccess: jest.fn(),
  onError: jest.fn(),
  onNavigation: jest.fn(),
  onButtonPress: jest.fn(),
  onFormSubmit: jest.fn(),
  triggerLight: jest.fn(),
}

describe('TransactionBottomSheet Haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useHaptics as jest.Mock).mockReturnValue(mockHaptics)
  })

  const renderWithProvider = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('should initialize with haptic methods from useHaptics hook', () => {
    const ref = React.createRef<any>()
    
    renderWithProvider(<TransactionBottomSheet ref={ref} />)
    
    expect(useHaptics).toHaveBeenCalled()
  })

  it('should call onNavigation when opening add transaction', () => {
    const ref = React.createRef<any>()
    
    renderWithProvider(<TransactionBottomSheet ref={ref} />)
    
    // Simulate opening add transaction
    ref.current?.openAddTransaction()
    
    expect(mockHaptics.onNavigation).toHaveBeenCalled()
  })

  it('should call onNavigation when opening edit transaction', () => {
    const ref = React.createRef<any>()
    
    renderWithProvider(<TransactionBottomSheet ref={ref} />)
    
    // Simulate opening edit transaction
    ref.current?.openEditTransaction('test-id')
    
    expect(mockHaptics.onNavigation).toHaveBeenCalled()
  })

  it('should call triggerLight when closing the sheet', () => {
    const ref = React.createRef<any>()
    
    renderWithProvider(<TransactionBottomSheet ref={ref} />)
    
    // Simulate closing
    ref.current?.close()
    
    expect(mockHaptics.triggerLight).toHaveBeenCalled()
  })
})