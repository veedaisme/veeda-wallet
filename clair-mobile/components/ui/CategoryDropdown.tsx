import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { getCategoryIcon, getCategoryColor } from '@/constants/Categories'
import { TRANSACTION_CATEGORIES } from '@/types/transaction'

interface CategoryDropdownProps {
  value?: string
  onSelect: (category: string) => void
  error?: string
  placeholder?: string
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  value,
  onSelect,
  error,
  placeholder = 'Select a category',
}) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [isOpen, setIsOpen] = useState(false)

  const selectedCategory = TRANSACTION_CATEGORIES.find(cat => cat === value)

  const handleSelect = (category: string) => {
    onSelect(category)
    setIsOpen(false)
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.text }]}>
          Category
        </Text>
        
        <TouchableOpacity
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.background,
              borderColor: error ? colors.error : (isOpen ? colors.primary : colors.border),
            },
          ]}
          onPress={() => setIsOpen(true)}
        >
          <View style={styles.selectedContent}>
            <Ionicons 
              name="folder-outline" 
              size={20} 
              color={colors.icon} 
              style={styles.leftIcon}
            />
            
            {selectedCategory ? (
              <View style={styles.categoryDisplay}>
                <Text style={styles.categoryIcon}>
                  {getCategoryIcon(selectedCategory)}
                </Text>
                <Text style={[styles.selectedText, { color: colors.text }]}>
                  {selectedCategory}
                </Text>
              </View>
            ) : (
              <Text style={[styles.placeholder, { color: colors.textMuted }]}>
                {placeholder}
              </Text>
            )}
          </View>
          
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.icon}
          />
        </TouchableOpacity>

        {error && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        )}
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />
          
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Category
              </Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryList}>
              {TRANSACTION_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor: value === category 
                        ? getCategoryColor(category) + '10' 
                        : 'transparent',
                    },
                  ]}
                  onPress={() => handleSelect(category)}
                >
                  <View style={styles.categoryItemContent}>
                    <View style={[
                      styles.categoryIconContainer,
                      { backgroundColor: getCategoryColor(category) + '20' }
                    ]}>
                      <Text style={styles.categoryItemIcon}>
                        {getCategoryIcon(category)}
                      </Text>
                    </View>
                    
                    <Text style={[styles.categoryItemText, { color: colors.text }]}>
                      {category}
                    </Text>
                  </View>

                  {value === category && (
                    <Ionicons 
                      name="checkmark" 
                      size={20} 
                      color={getCategoryColor(category)} 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftIcon: {
    marginRight: 8,
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  selectedText: {
    fontSize: 16,
  },
  placeholder: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryItemIcon: {
    fontSize: 16,
  },
  categoryItemText: {
    fontSize: 16,
  },
})