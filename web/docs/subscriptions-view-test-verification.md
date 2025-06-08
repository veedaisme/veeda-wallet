# SubscriptionsView Component - Test Verification Guide

## Overview

This document provides comprehensive testing instructions for the modernized SubscriptionsView component to ensure all functionality works correctly after the React Query and Zustand integration.

## Pre-Testing Setup

### 1. **Environment Verification**
```bash
# Ensure development server is running
cd web && npm run dev

# Verify no TypeScript errors
npx tsc --noEmit --skipLibCheck
```

### 2. **Browser DevTools Setup**
- Open browser DevTools
- Enable Console tab for mutation logs
- Install React Query DevTools (if available)
- Clear browser cache for fresh testing

## Manual Testing Checklist

### 🔄 **Component Loading Tests**

#### Test 1: Initial Load
- [ ] Navigate to main page where SubscriptionsView is displayed
- [ ] **Expected**: Skeleton loading appears for both summary and list sections
- [ ] **Expected**: Loading completes within 2-3 seconds
- [ ] **Expected**: No console errors during loading

#### Test 2: Data Display
- [ ] **Expected**: Summary section shows monthly/yearly spending and active count
- [ ] **Expected**: Upcoming payments section shows projected subscriptions
- [ ] **Expected**: All data displays correctly formatted (currency, dates)

#### Test 3: Empty State
- [ ] Test with user who has no subscriptions
- [ ] **Expected**: "No subscriptions yet" message in summary
- [ ] **Expected**: "No upcoming payments" message in list section

#### Test 4: Error State
- [ ] Simulate network error (disconnect internet briefly)
- [ ] **Expected**: Error message displays in red box
- [ ] **Expected**: Error message is user-friendly
- [ ] **Expected**: Component recovers when network restored

### 🎯 **Modal Integration Tests**

#### Test 5: Add Subscription Modal
- [ ] Click "Add Subscription" button in upcoming payments section
- [ ] **Expected**: Modal opens with empty form
- [ ] **Expected**: Modal title shows "Add Subscription"
- [ ] **Expected**: Form fields are empty/default values

#### Test 6: Modal State Persistence
- [ ] Open add subscription modal
- [ ] Fill in some form data
- [ ] Close modal without saving
- [ ] Reopen modal
- [ ] **Expected**: Form is reset to empty state
- [ ] **Expected**: No data persists from previous session

### 💾 **Mutation Tests**

#### Test 7: Add Subscription
- [ ] Open add subscription modal
- [ ] Fill in all required fields:
  - Provider name: "Test Service"
  - Amount: 50000
  - Currency: IDR
  - Frequency: Monthly
  - Payment date: Next month
- [ ] Click Save
- [ ] **Expected**: Console shows: "Subscription added successfully, invalidating caches..."
- [ ] **Expected**: Modal closes automatically
- [ ] **Expected**: Summary updates immediately (count increases)
- [ ] **Expected**: New subscription appears in upcoming payments
- [ ] **Expected**: No page refresh needed

#### Test 8: Mutation Loading State
- [ ] Open add subscription modal
- [ ] Fill form and click Save
- [ ] **Expected**: Save button shows loading state
- [ ] **Expected**: Form is disabled during save
- [ ] **Expected**: Loading state clears after completion

#### Test 9: Mutation Error Handling
- [ ] Simulate API error (invalid data or network issue)
- [ ] **Expected**: Error message appears
- [ ] **Expected**: Modal remains open
- [ ] **Expected**: User can retry or cancel

### 🔗 **Navigation Tests**

#### Test 10: View All Navigation
- [ ] Click on "Active Subscriptions" card with arrow
- [ ] **Expected**: Navigates to `/subscriptions` page
- [ ] **Expected**: URL includes `?from=subscriptions` parameter
- [ ] **Expected**: Navigation preserves locale (en/id)

#### Test 11: Cross-Component Sync
- [ ] Add subscription in SubscriptionsView
- [ ] Navigate to subscriptions page
- [ ] **Expected**: New subscription appears in detailed list
- [ ] Navigate back to main page
- [ ] **Expected**: Summary reflects the addition

### 📊 **Performance Tests**

#### Test 12: Cache Behavior
- [ ] Load main page (first time)
- [ ] Note loading time
- [ ] Navigate away and return to main page
- [ ] **Expected**: Second load is significantly faster (cached)
- [ ] **Expected**: Data appears instantly from cache

#### Test 13: Background Updates
- [ ] Keep main page open
- [ ] In another tab, add subscription via subscriptions page
- [ ] Return to main page
- [ ] **Expected**: Data updates automatically (cache invalidation)
- [ ] **Expected**: No manual refresh needed

### 🎨 **UI/UX Tests**

#### Test 14: Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768px width)
- [ ] Test on mobile (375px width)
- [ ] **Expected**: Layout adapts properly
- [ ] **Expected**: All elements remain accessible

#### Test 15: Loading States
- [ ] **Expected**: Skeleton loading matches content structure
- [ ] **Expected**: No layout shift when loading completes
- [ ] **Expected**: Loading states are visually appealing

#### Test 16: Accessibility
- [ ] Test keyboard navigation
- [ ] Test with screen reader (if available)
- [ ] **Expected**: All interactive elements are accessible
- [ ] **Expected**: Proper ARIA labels and focus management

## Technical Verification

### 🔍 **React Query Integration**

#### Console Verification
```javascript
// In browser console, check for these logs:
// - Query execution logs
// - Cache invalidation logs
// - Mutation success/error logs
```

#### DevTools Verification (if React Query DevTools available)
- [ ] Check query keys: `['subscriptions', 'consolidated', userId, projectionEndDate]`
- [ ] Verify query status: fresh/stale/loading
- [ ] Monitor cache invalidation on mutations

### 🏪 **Zustand Store Integration**

#### Store State Verification
```javascript
// In browser console:
window.__ZUSTAND_STORE__ // Check if store is accessible
// Verify modal states update correctly
```

### 📈 **Performance Metrics**

#### Expected Performance
- **Initial Load**: < 3 seconds
- **Cached Load**: < 500ms
- **Mutation Response**: < 2 seconds
- **UI Updates**: Immediate (< 100ms)

#### Performance Red Flags
- ❌ Long loading times (> 5 seconds)
- ❌ Multiple network requests for same data
- ❌ UI freezing during operations
- ❌ Memory leaks (check DevTools Memory tab)

## Integration Testing

### 🔄 **Cross-Component Testing**

#### Test 17: Main Page → Subscriptions Page
1. Add subscription in SubscriptionsView
2. Navigate to subscriptions page
3. **Expected**: New subscription visible in detailed list
4. Edit subscription on subscriptions page
5. Navigate back to main page
6. **Expected**: Changes reflected in SubscriptionsView

#### Test 18: Modal State Consistency
1. Open subscription modal from SubscriptionsView
2. Close modal
3. Open subscription modal from subscriptions page
4. **Expected**: Modal state is consistent
5. **Expected**: No data leakage between contexts

## Error Scenarios

### 🚨 **Error Handling Tests**

#### Test 19: Network Errors
- [ ] Disconnect internet during loading
- [ ] **Expected**: Graceful error message
- [ ] **Expected**: Retry functionality works

#### Test 20: API Errors
- [ ] Simulate 500 server error
- [ ] **Expected**: User-friendly error message
- [ ] **Expected**: Component doesn't crash

#### Test 21: Invalid Data
- [ ] Submit form with invalid data
- [ ] **Expected**: Validation errors display
- [ ] **Expected**: Form prevents submission

## Success Criteria

### ✅ **All Tests Must Pass**
- [ ] All loading states work correctly
- [ ] All mutations complete successfully
- [ ] All navigation functions properly
- [ ] All error states handle gracefully
- [ ] Performance meets expectations
- [ ] UI/UX is smooth and responsive

### 📊 **Performance Benchmarks**
- [ ] Initial load < 3 seconds
- [ ] Cached load < 500ms
- [ ] Mutations < 2 seconds
- [ ] No memory leaks
- [ ] Smooth animations

### 🎯 **Functional Requirements**
- [ ] Data displays correctly
- [ ] Mutations work as expected
- [ ] Cache invalidation functions
- [ ] Cross-component sync works
- [ ] Error handling is robust

## Troubleshooting Guide

### Common Issues

#### Issue: Data Not Loading
**Check**: Network tab for API calls
**Check**: Console for error messages
**Solution**: Verify user authentication and API endpoints

#### Issue: Modal Not Opening
**Check**: Zustand store state in console
**Check**: Component props and event handlers
**Solution**: Verify store integration and action calls

#### Issue: Cache Not Invalidating
**Check**: Console for invalidation logs
**Check**: React Query DevTools
**Solution**: Verify mutation onSuccess callbacks

#### Issue: Performance Problems
**Check**: Network tab for excessive requests
**Check**: React DevTools Profiler
**Solution**: Verify query configuration and caching

## Rollback Plan

If critical issues are found:

1. **Immediate Rollback**:
   ```bash
   git checkout HEAD~1 -- web/components/subscriptions/SubscriptionsView.tsx
   ```

2. **Partial Rollback**: Revert specific changes while keeping improvements

3. **Full Rollback**: Revert entire modernization and investigate issues

## Next Steps

After successful testing:
1. ✅ Mark SubscriptionsView modernization as complete
2. 🚀 Deploy to staging environment
3. 📊 Monitor performance metrics
4. 🔄 Plan next component modernization

**The SubscriptionsView component modernization testing is comprehensive and ensures all functionality works correctly with the new React Query and Zustand architecture.**
