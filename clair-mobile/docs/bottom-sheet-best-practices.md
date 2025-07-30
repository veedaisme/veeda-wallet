# Bottom Sheet Best Practices and Implementation Guide

## Overview

This document outlines the best practices for implementing and using the custom BottomSheet component in the Clair mobile application, based on industry standards and the @gorhom/react-native-bottom-sheet library patterns.

## Current Implementation Analysis

### Issues with Previous Implementation

1. **Static Height Calculation**: The previous implementation used fixed percentage-based height calculations which didn't adapt to content size
2. **Poor Content Alignment**: Fixed heights often resulted in either too much empty space or content being cut off
3. **Manual Height Management**: Required manual specification of height percentages which was not maintainable

### Improvements Made

1. **Dynamic Height Sizing**: Added `snapToContentHeight` prop for automatic height adjustment
2. **Content Measurement**: Implemented layout measurement to calculate actual content height
3. **Flexible Configuration**: Maintained backward compatibility with existing height props
4. **Performance Optimizations**: Added proper useEffect dependencies and cleanup

## Best Practices for Bottom Sheet Height Handling

### 1. Use Dynamic Height for Variable Content

```tsx
// Recommended for forms, variable content
<BottomSheet
  snapToContentHeight={true}
  isVisible={isVisible}
  onClose={handleClose}
>
  {/* Content that varies in height */}
</BottomSheet>
```

### 2. Use Fixed Heights for Consistent UI

```tsx
// Recommended for consistent, predictable content
<BottomSheet
  height="60%" // or height={400}
  isVisible={isVisible}
  onClose={handleClose}
>
  {/* Content with known, consistent height */}
</BottomSheet>
```

### 3. Content Layout Considerations

- Always wrap content in a container with proper padding
- Use `onLayout` events for measuring content dimensions
- Consider safe area insets for proper positioning
- Account for keyboard visibility in input-heavy sheets

### 4. Performance Optimization

- Use `useRef` for animation values to prevent recreation
- Implement proper cleanup in `useEffect` hooks
- Add small delays for layout measurement to ensure rendering
- Memoize expensive calculations

## Implementation Details

### New Props

- `snapToContentHeight`: Boolean to enable automatic height adjustment
- Maintains all existing props for backward compatibility

### Key Features

1. **Automatic Content Measurement**: Uses `onLayout` to measure actual content height
2. **Height Constraints**: Constrains height to 90% of screen height for usability
3. **Smooth Animations**: Maintains all existing animation behaviors
4. **Backward Compatibility**: Existing height props work unchanged

### Usage Examples

#### Dynamic Height (Recommended for Forms)
```tsx
<BottomSheet
  snapToContentHeight={true}
  isVisible={isVisible}
  onClose={handleClose}
>
  <ScrollView>
    <FormFields />
  </ScrollView>
</BottomSheet>
```

#### Fixed Height
```tsx
<BottomSheet
  height="75%"
  isVisible={isVisible}
  onClose={handleClose}
>
  <StaticContent />
</BottomSheet>
```

## Migration Guide

### Before
```tsx
<BottomSheet
  height="85%"
  isVisible={isVisible}
  onClose={handleClose}
>
  {/* Content */}
</BottomSheet>
```

### After (Recommended)
```tsx
<BottomSheet
  snapToContentHeight={true}
  isVisible={isVisible}
  onClose={handleClose}
>
  {/* Content - height automatically adjusts */}
</BottomSheet>
```

## Best Practices from @gorhom/react-native-bottom-sheet

Based on Context7 research, the industry-standard approaches include:

1. **Dynamic Snap Points**: Use `useBottomSheetDynamicSnapPoints` for content-based height calculation
2. **Content Height Measurement**: Always measure actual content dimensions
3. **Layout Animation**: Smooth transitions when height changes
4. **Performance Considerations**: Minimize re-renders and optimize layout calculations

## Testing Recommendations

1. Test on different screen sizes and orientations
2. Verify keyboard interaction with input fields
3. Check swipe-to-dismiss behavior with various content heights
4. Validate backdrop tap dismissal functionality
5. Test Android back button behavior

## Future Improvements

1. **Keyboard Handling**: Integrate with `KeyboardAvoidingView` for better input accessibility
2. **Snap Points**: Add support for multiple snap points based on content sections
3. **Accessibility**: Enhance with proper accessibility props and focus management
4. **Gesture Handling**: Improve conflict resolution with nested scrollable components

## References

- [@gorhom/react-native-bottom-sheet Documentation](https://github.com/gorhom/react-native-bottom-sheet)
- React Native Layout Measurement Best Practices
- Mobile UI/UX Design Guidelines for Bottom Sheets
