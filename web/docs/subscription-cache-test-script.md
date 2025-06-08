# Subscription Cache Invalidation Test Script

## Quick Test Commands

### 1. **Browser Console Test**

Open browser console and run these commands to verify cache invalidation:

```javascript
// Test 1: Check if React Query DevTools shows subscription queries
// Look for queries starting with ['subscriptions']

// Test 2: Monitor cache invalidation
// Watch the Network tab and React Query DevTools during mutations

// Test 3: Verify console logs
// Should see: "Subscription [operation] successfully, invalidating caches..."
```

### 2. **Manual UI Test Sequence**

```
Step 1: Open subscriptions page
Step 2: Open browser DevTools → Console tab
Step 3: Add a new subscription
Step 4: Verify console shows:
  "Subscription added successfully, invalidating caches..."
  "Cache invalidation completed for subscription addition"
Step 5: Verify subscription appears immediately in list
Step 6: Edit the subscription
Step 7: Verify console shows update logs
Step 8: Verify changes appear immediately
Step 9: Delete the subscription  
Step 10: Verify console shows deletion logs
Step 11: Verify subscription disappears immediately
```

### 3. **React Query DevTools Verification**

If React Query DevTools is installed:

```
1. Open React Query DevTools
2. Look for these query keys:
   - ['subscriptions', 'list', userId]
   - ['subscriptions', 'consolidated', userId, projectionEndDate]
   - ['dashboard', 'summary']
3. Perform a subscription mutation
4. Watch queries get invalidated and refetched
5. Verify "fresh" status on all subscription queries
```

## Expected Behavior Checklist

### ✅ **Add Subscription**
- [ ] Console shows: "Subscription added successfully, invalidating caches..."
- [ ] Console shows: "Cache invalidation completed for subscription addition"
- [ ] New subscription appears in list immediately
- [ ] No page refresh needed
- [ ] Dashboard updates if it shows subscription data

### ✅ **Update Subscription**
- [ ] Console shows: "Subscription updated successfully, invalidating caches..."
- [ ] Console shows: "Cache invalidation completed for subscription update"
- [ ] Changes appear in list immediately
- [ ] Modal closes automatically
- [ ] No page refresh needed

### ✅ **Delete Subscription**
- [ ] Console shows: "Subscription deleted successfully, invalidating caches..."
- [ ] Console shows: "Cache invalidation completed for subscription deletion"
- [ ] Subscription disappears from list immediately
- [ ] Modal closes automatically
- [ ] No page refresh needed

## Troubleshooting

### **If subscriptions don't update immediately:**

1. **Check console for errors**:
   ```
   Look for: "Failed to add/update/delete subscription"
   ```

2. **Verify React Query setup**:
   ```
   Ensure QueryClientProvider is properly configured
   ```

3. **Check network requests**:
   ```
   Verify API calls are successful (200 status)
   ```

4. **Verify query keys**:
   ```
   Ensure useSubscriptions() is using correct query key
   ```

### **If console logs don't appear:**

1. **Check mutation usage**:
   ```typescript
   // Verify mutations are called with await
   await addSubscriptionMutation.mutateAsync({...});
   ```

2. **Check error handling**:
   ```typescript
   // Ensure try/catch doesn't swallow success logs
   ```

## Performance Verification

### **Expected Performance**:
- ✅ Mutations complete in < 1 second
- ✅ UI updates appear immediately after mutation
- ✅ No loading spinners after successful mutation
- ✅ Smooth user experience

### **Performance Red Flags**:
- ❌ Long delays before UI updates
- ❌ Multiple network requests for same data
- ❌ Loading states that don't resolve
- ❌ UI freezing during mutations

## Integration Test

### **Cross-Component Verification**:

1. **Test subscription page → dashboard sync**:
   ```
   1. Add subscription on subscriptions page
   2. Navigate to dashboard
   3. Verify dashboard reflects new subscription data
   ```

2. **Test main page subscription modal → subscriptions page sync**:
   ```
   1. Add subscription via main page modal
   2. Navigate to subscriptions page
   3. Verify new subscription appears in list
   ```

## Success Criteria

The cache invalidation is working correctly when:

✅ **All manual tests pass**
✅ **Console logs appear as expected**  
✅ **UI updates are immediate and smooth**
✅ **No manual refresh is ever needed**
✅ **Performance is responsive**
✅ **Cross-component sync works**
✅ **Pattern matches TransactionView behavior**

## Rollback Plan

If issues are found, rollback by reverting these files:
- `web/hooks/queries/useSubscriptionsQuery.ts`
- `web/lib/queryKeys.ts`

And restore the previous direct query key invalidation pattern.
