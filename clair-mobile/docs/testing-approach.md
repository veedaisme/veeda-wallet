# Testing Approach for Clair Mobile

## Overview

This document outlines the testing approach and best practices for the Clair mobile application.

## Current Testing Status

The project currently does not have established testing patterns for mobile components. The web directory contains some test examples using `@testing-library/react` and Jest.

## Recommended Testing Strategy

### 1. Component Testing

For React Native components like BottomSheet, we recommend:

1. **Snapshot Testing**: Basic rendering verification
2. **Interaction Testing**: Test user interactions (press, swipe, etc.)
3. **Props Testing**: Verify different prop combinations work correctly
4. **State Testing**: Test component behavior with different states

### 2. Testing Libraries

To implement proper testing, the following dependencies would need to be added:

```bash
npm install --save-dev @testing-library/react-native jest react-test-renderer
```

### 3. Test Structure

Following the pattern from `web/components/transactions-list.test.tsx`:

```tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'

// Mocks for dependencies
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light'
}))

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: {
      background: '#ffffff',
      border: '#cccccc'
    }
  }
}))

describe('BottomSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly when visible', () => {
    // Test implementation
  })
})
```

### 4. Testing Scenarios for BottomSheet

1. **Visibility Control**: Test show/hide behavior
2. **Height Configuration**: Test fixed height, percentage height, and dynamic height
3. **Backdrop Interaction**: Test backdrop tap to dismiss
4. **Swipe Gestures**: Test swipe to dismiss functionality
5. **Content Rendering**: Verify children are rendered correctly
6. **Animation States**: Test open/close animations

### 5. Future Testing Improvements

1. **Add Testing Dependencies**: Install proper testing libraries
2. **Create Test Utilities**: Shared mock configurations and helper functions
3. **Component Test Coverage**: Gradually add tests for all UI components
4. **Integration Testing**: Test component interactions and workflows
5. **E2E Testing**: Consider Detox or similar for end-to-end testing

## Current BottomSheet Testing Considerations

The BottomSheet component has been enhanced with:

1. **Dynamic Height Sizing**: `snapToContentHeight` prop for automatic height adjustment
2. **Content Measurement**: Layout measurement for actual content height calculation
3. **Backward Compatibility**: All existing functionality preserved

These features should be tested with various content types and screen sizes.

## References

- React Native Testing Library Documentation
- Jest Testing Framework
- Existing web component tests in the project
