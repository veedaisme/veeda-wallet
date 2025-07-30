import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native'
import { User, LogOut } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'

import { LanguagePillToggle } from '@/components/ui/LanguagePillToggle'
import { useAuth } from '@/hooks/useAuthV2'

interface HeaderProps {
  title?: string
  showAddButton?: boolean
  onAddPress?: () => void
  addIcon?: React.ReactNode
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showAddButton = false,
  onAddPress,
  addIcon,
}) => {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    setProfileMenuOpen(false)
  }

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image
          source={require('@/assets/images/clair_v2_transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {title && (
          <Text style={styles.title}>
            {title}
          </Text>
        )}
      </View>
      
      <View style={styles.headerRight}>
        <LanguagePillToggle size="sm" />
        
        {showAddButton && onAddPress && (
          <TouchableOpacity 
            onPress={onAddPress}
            style={styles.addButton}
          >
            {addIcon}
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setProfileMenuOpen(!profileMenuOpen)}
        >
          <User size={20} color="#6B7280" />
        </TouchableOpacity>
        
        {/* Profile Menu */}
        {profileMenuOpen && (
          <View style={styles.profileMenu}>
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={handleLogout}
            >
              <LogOut size={16} color="#6B7280" />
              <Text style={styles.profileMenuText}>{t('app.logout')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    backgroundColor: 'white',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    height: 88,
    width: 88,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 16,
  },
  headerRight: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    padding: 8,
  },
  profileButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 8,
  },
  profileMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
    zIndex: 1000,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  profileMenuText: {
    color: '#374151',
    fontSize: 14,
  },
})