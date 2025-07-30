import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/src/i18n';

// Language Label Component
const LanguageLabel = ({ text, active, fontSize }: { text: string; active: boolean; fontSize: number }) => (
  <Text style={[styles.languageText, { fontSize }, active && styles.activeLanguageText]}>
    {text}
  </Text>
);

interface LanguagePillToggleProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LanguagePillToggle: React.FC<LanguagePillToggleProps> = ({
  size = 'md',
}) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as 'en' | 'id';

  const sizeConfig = {
    sm: { fontSize: 12, padding: 8, gap: 6, buttonPadding: 4 },
    md: { fontSize: 14, padding: 10, gap: 8, buttonPadding: 6 },
    lg: { fontSize: 16, padding: 12, gap: 10, buttonPadding: 8 },
  };

  const config = sizeConfig[size];

  const handleLanguageChange = async (language: 'en' | 'id') => {
    if (language !== currentLanguage) {
      await changeLanguage(language);
    }
  };

  return (
    <View style={[styles.container, { padding: config.padding }]}>
      <View style={[styles.pillContainer, { gap: config.gap }]}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            { padding: config.buttonPadding },
            currentLanguage === 'en' && styles.activeButton,
          ]}
          onPress={() => handleLanguageChange('en')}
          activeOpacity={0.7}
        >
          <LanguageLabel 
            text="EN" 
            active={currentLanguage === 'en'} 
            fontSize={config.fontSize}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.languageButton,
            { padding: config.buttonPadding },
            currentLanguage === 'id' && styles.activeButton,
          ]}
          onPress={() => handleLanguageChange('id')}
          activeOpacity={0.7}
        >
          <LanguageLabel 
            text="ID" 
            active={currentLanguage === 'id'} 
            fontSize={config.fontSize}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButton: {
    borderRadius: 12,
    opacity: 0.6,
    transform: [{ scale: 0.9 }],
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  // Language text styles
  languageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeLanguageText: {
    color: '#374151',
  },
});

export default LanguagePillToggle;