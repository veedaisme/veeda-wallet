# PWA Testing Guide

## Overview

This document provides comprehensive testing guidelines for the Veeda Wallet PWA implementation. The application uses `next-pwa` for Progressive Web App capabilities including service workers, caching, and offline functionality.

## PWA Features Implemented

### Core PWA Components
- **Service Worker**: Automatic caching via `next-pwa`
- **Web App Manifest**: `/public/manifest.json`
- **Offline Support**: `/public/offline.html`
- **Install Prompt**: `components/PWAInstallPrompt.tsx`
- **Network Status**: `components/NetworkStatus.tsx`
- **Network Hook**: `hooks/useNetworkStatus.ts`

### Icons & Assets
- Multiple icon sizes (192x192, 256x256, 384x384, 512x512)
- Proper manifest configuration
- Offline fallback page

## Testing Methods

### 1. Manual Testing

#### A. Development Environment
```bash
# Start development server
npm run dev

# Build for production testing
npm run build
npm run start
```

#### B. Chrome DevTools Testing
1. **Application Tab → Manifest**
   - Verify manifest.json loads correctly
   - Check all required fields are present
   - Validate icon paths and sizes

2. **Application Tab → Service Workers**
   - Confirm service worker registers successfully
   - Monitor SW lifecycle events
   - Check SW update mechanism

3. **Application Tab → Storage**
   - Inspect Cache Storage entries
   - Verify caching strategy implementation
   - Check IndexedDB if used

4. **Network Tab → Offline Mode**
   - Enable offline mode
   - Navigate between pages
   - Verify offline page displays
   - Test cached resource loading

#### C. PWA Install Flow Testing
1. **Desktop Chrome**
   - Look for install prompt in address bar
   - Test install via Chrome menu
   - Verify app opens as standalone

2. **Mobile Testing**
   - Test "Add to Home Screen" functionality
   - Verify standalone mode behavior
   - Check splash screen display

### 2. Lighthouse PWA Audit

#### Running Lighthouse
1. Open Chrome DevTools
2. Navigate to Lighthouse tab
3. Select "Progressive Web App" category
4. Run audit on built application

#### Key Metrics to Check
- **Installable**: Web app manifest and service worker
- **PWA Optimized**: Viewport, splash screen, theme colors
- **Performance**: Fast loading, responsive design
- **Accessibility**: Screen reader support, color contrast

### 3. Automated Testing Setup

#### A. Unit Tests for PWA Components

```javascript
// Example test for PWAInstallPrompt
describe('PWAInstallPrompt', () => {
  it('should show install prompt when supported', () => {
    // Test install prompt visibility
    // Test install event handling
  });
});

// Example test for NetworkStatus
describe('NetworkStatus', () => {
  it('should detect online/offline status', () => {
    // Test network status detection
    // Test status change handling
  });
});
```

#### B. E2E PWA Testing

```javascript
// Example Playwright test
test('PWA installation flow', async ({ page }) => {
  await page.goto('/');
  
  // Test install prompt
  await page.locator('[data-testid="pwa-install-button"]').click();
  
  // Verify installation
  // Test standalone mode
});
```

### 4. Service Worker Testing

#### A. Cache Strategy Testing
```javascript
// Test caching behavior
test('service worker caches resources', async () => {
  // Load page
  // Check cache storage
  // Verify cached resources
});
```

#### B. Offline Functionality
```javascript
// Test offline mode
test('app works offline', async () => {
  // Load page online
  // Go offline
  // Navigate and verify cached content
});
```

### 5. Cross-Browser Testing

#### Browsers to Test
- **Chrome**: Full PWA support
- **Firefox**: Limited PWA support
- **Safari**: Basic PWA support
- **Edge**: Full PWA support

#### Mobile Browsers
- **Chrome Mobile**: Full PWA support
- **Safari Mobile**: Limited PWA support
- **Samsung Internet**: Good PWA support

### 6. Network Conditions Testing

#### Test Scenarios
1. **Online**: Full functionality
2. **Offline**: Cached content only
3. **Slow 3G**: Performance under constraints
4. **Intermittent**: Connection drops and recovers

#### Using Chrome DevTools
1. Network tab → Throttling dropdown
2. Select network condition
3. Test application behavior
4. Monitor performance metrics

### 7. Performance Testing

#### Key Metrics
- **First Contentful Paint (FCP)**
- **Largest Contentful Paint (LCP)**
- **Time to Interactive (TTI)**
- **Cache Hit Ratio**

#### Testing Tools
- Chrome DevTools Performance tab
- Lighthouse performance audit
- WebPageTest.org
- Network throttling simulation

### 8. Security Testing

#### Areas to Test
- **HTTPS Requirement**: PWA must be served over HTTPS
- **Content Security Policy**: Check CSP headers
- **Service Worker Security**: Verify SW origin restrictions
- **Manifest Security**: Validate manifest.json fields

### 9. Accessibility Testing

#### PWA-Specific Accessibility
- **Install Prompt**: Screen reader compatible
- **Offline States**: Clear messaging
- **Loading States**: Appropriate feedback
- **Navigation**: Keyboard accessible

### 10. Common Issues & Troubleshooting

#### Service Worker Issues
- **Not Registering**: Check HTTPS requirement
- **Not Updating**: Clear cache and hard refresh
- **Scope Issues**: Verify SW file location

#### Manifest Issues
- **Icons Not Loading**: Check icon paths and sizes
- **Install Prompt Missing**: Verify manifest completeness
- **Wrong Theme Colors**: Check theme-color meta tag

#### Caching Issues
- **Stale Content**: Implement cache versioning
- **Large Cache**: Monitor cache size limits
- **Cache Conflicts**: Test cache invalidation

#### Configuration Issues
- **"Invalid next.config.mjs options detected: Unrecognized key(s) in object: 'pwa'"**: 
  - This error occurs when PWA configuration is incorrectly placed in the main Next.js config
  - **Fix**: Move PWA configuration to the `withPWA()` function call instead of the main `nextConfig` object
  - **Incorrect**: `const nextConfig = { pwa: { ... } }`
  - **Correct**: `const pwaConfig = withPWA({ dest: 'public', ... })`

#### PWA Support Messages
- **"PWA support is disabled"** in development mode is expected behavior
- PWA features are automatically disabled in development for better debugging
- To test PWA features, build for production: `npm run build && npm run start`

### 11. Test Checklist

#### Pre-Production Testing
- [ ] Service worker registers successfully
- [ ] Manifest validates without errors
- [ ] Install prompt appears correctly
- [ ] Offline functionality works
- [ ] All icon sizes load properly
- [ ] Network status detection works
- [ ] Cache strategy performs well
- [ ] Cross-browser compatibility confirmed
- [ ] Mobile responsiveness verified
- [ ] Performance meets standards
- [ ] Accessibility requirements met
- [ ] Security best practices followed

#### Production Monitoring
- [ ] Service worker updates properly
- [ ] Cache hit rates are optimal
- [ ] Install conversion rates tracked
- [ ] Performance metrics monitored
- [ ] Error rates acceptable
- [ ] User engagement metrics positive

### 12. Testing Commands

```bash
# Development testing
npm run dev

# Production build testing
npm run build
npm run start

# Linting
npm run lint

# Performance analysis
npm run analyze
```

### 13. Useful Resources

#### Tools
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox](https://developers.google.com/web/tools/workbox)

#### Documentation
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Next.js PWA Guide](https://nextjs.org/docs/basic-features/progressive-web-app)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Validation Results

### Current PWA Status ✅
- **Service Worker**: Generated successfully (`/public/sw.js`)
- **Workbox Runtime**: Generated successfully (`/public/workbox-*.js`)
- **Manifest**: Valid (`/public/manifest.json`)
- **Icons**: All sizes present (192x192, 256x256, 384x384, 512x512)
- **Offline Page**: Available (`/public/offline.html`)
- **PWA Components**: 
  - `PWAInstallPrompt.tsx` - Install prompt handling
  - `NetworkStatus.tsx` - Network status indicator
  - `useNetworkStatus.ts` - Network status hook

### Build Process ✅
- **Development**: PWA support disabled (expected behavior)
- **Production**: PWA support enabled with full functionality
- **Build Output**: No errors, service worker compilation successful
- **Configuration**: `next.config.mjs` properly configured with `withPWA()`

### Testing Commands Validated ✅
```bash
# Development (PWA disabled)
npm run dev ✅

# Production build (PWA enabled)
npm run build ✅

# Production server (PWA active)
npm run start ✅
```

## Conclusion

Regular PWA testing ensures optimal user experience across all devices and network conditions. Focus on the install flow, offline functionality, and performance metrics for the best results.

For specific implementation details, refer to the PWA components in the `components/` directory and the configuration in `next.config.mjs`.