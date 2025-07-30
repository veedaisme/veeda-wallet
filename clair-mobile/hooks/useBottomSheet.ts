import { useRef, useState, useCallback } from 'react'
import type { BottomSheetMethods } from '@/components/ui/BottomSheet'

interface UseBottomSheetOptions {
  onOpen?: () => void
  onClose?: () => void
}

export const useBottomSheet = (options: UseBottomSheetOptions = {}) => {
  const { onOpen, onClose } = options
  
  const bottomSheetRef = useRef<BottomSheetMethods>(null)
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => {
    bottomSheetRef.current?.open()
  }, [])

  const close = useCallback(() => {
    bottomSheetRef.current?.close()
  }, [])

  const toggle = useCallback(() => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }, [isOpen, open, close])

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    onOpen?.()
  }, [onOpen])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    onClose?.()
  }, [onClose])

  return {
    // Ref to pass to BottomSheet component
    bottomSheetRef,
    // State
    isOpen,
    // Methods
    open,
    close,
    toggle,
    // Callbacks to pass to BottomSheet component
    onOpen: handleOpen,
    onClose: handleClose,
  }
}