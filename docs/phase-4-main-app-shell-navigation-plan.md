# Phase 4: Main App Shell & Navigation – Detailed Implementation Breakdown

## Overview

**Goal:**  
Implement the main application shell, including robust routing, protected navigation, a bottom navigation bar (Dashboard, Transactions), and a profile menu. This phase establishes the core user experience and navigation structure, ensuring only authenticated users can access main features.

---

## Sub-Tasks Breakdown

### 4.1. Analyze and Finalize Navigation Structure

- **Description:**  
  Review app requirements and finalize the navigation structure, including route hierarchy, protected routes, and navigation flows (e.g., Dashboard, Transactions, Profile).
- **Dependencies:**  
  - App requirements (RFC, implementation plan)
  - Existing directory structure
- **Order:**  
  1st (foundation for all routing work)

---

### 4.2. Choose and Configure Routing Package

- **Description:**  
  Select `go_router` (preferred) or `auto_route` for declarative navigation. Add to `pubspec.yaml` if not already present. Configure initial router setup in `lib/app.dart` or a dedicated router file.
- **Dependencies:**  
  - pubspec.yaml
  - Riverpod providers (for auth state)
- **Order:**  
  2nd

---

### 4.3. Define Route Data Models and Route Guards

- **Description:**  
  Define route names, paths, and data models for navigation. Implement route guards to protect authenticated areas using Riverpod auth state.
- **Dependencies:**  
  - Auth state provider (from Phase 2/3)
  - Chosen router package
- **Order:**  
  3rd

---

### 4.4. Implement Main App Shell Widget

- **Description:**  
  Create a main shell widget that holds the bottom navigation bar and a body for routed content. Place in `lib/app.dart` or `lib/features/shell/`.
- **Dependencies:**  
  - Route definitions
  - Placeholder screens for Dashboard, Transactions, Profile
- **Order:**  
  4th

---

### 4.5. Build Bottom Navigation Bar

- **Description:**  
  Implement a bottom navigation bar with tabs for Dashboard and Transactions. Ensure navigation syncs with router state.
- **Dependencies:**  
  - Main app shell widget
  - Route setup
- **Order:**  
  5th

---

### 4.6. Create Placeholder Screens for Tabs

- **Description:**  
  Create minimal placeholder widgets/screens for Dashboard, Transactions, and Profile. Place in `lib/features/dashboard/`, `lib/features/transactions/`, and `lib/features/profile/`.
- **Dependencies:**  
  - Directory structure
- **Order:**  
  6th

---

### 4.7. Integrate Profile Menu (Modal or Drawer)

- **Description:**  
  Implement a profile menu accessible from the app shell (e.g., via an avatar or menu button). Use a modal bottom sheet or drawer. Include placeholder for logout/settings.
- **Dependencies:**  
  - Main app shell
  - Profile screen/widget
- **Order:**  
  7th

---

### 4.8. Connect Navigation to Auth State

- **Description:**  
  Ensure protected routes redirect unauthenticated users to the lock/auth screen. Integrate with Riverpod auth provider.
- **Dependencies:**  
  - Auth state provider
  - Route guards
- **Order:**  
  8th

---

### 4.9. Test Navigation Flows and Edge Cases

- **Description:**  
  Manually and/or with widget tests, verify navigation works as expected, including:
    - Authenticated/unauthenticated access
    - Tab switching
    - Profile menu access
    - Deep linking (if supported)
- **Dependencies:**  
  - All previous sub-tasks
- **Order:**  
  9th

---

### 4.10. Refactor and Document Navigation Code

- **Description:**  
  Refactor for clarity and maintainability. Add comments and update documentation to describe navigation structure and flows.
- **Dependencies:**  
  - Completed navigation implementation
- **Order:**  
  10th (finalize phase)

---

## Mermaid Diagram: Navigation Structure

```mermaid
graph TD
    A[App Entry] --> B{Auth State}
    B -- Authenticated --> C[Main App Shell]
    B -- Not Authenticated --> D[Lock/Auth Screen]
    C --> E[Dashboard Tab]
    C --> F[Transactions Tab]
    C --> G[Profile Menu (Modal/Drawer)]
```

---

## Summary Table

| Sub-Task | Description | Dependencies | Order |
|----------|-------------|--------------|-------|
| 4.1 | Analyze/finalize navigation structure | Requirements, structure | 1 |
| 4.2 | Choose/configure router | pubspec.yaml, Riverpod | 2 |
| 4.3 | Define routes/guards | Auth provider, router | 3 |
| 4.4 | Main app shell widget | Routes, placeholders | 4 |
| 4.5 | Bottom navigation bar | App shell, routes | 5 |
| 4.6 | Placeholder screens | Directory structure | 6 |
| 4.7 | Profile menu | App shell, profile | 7 |
| 4.8 | Connect to auth state | Auth provider, guards | 8 |
| 4.9 | Test navigation | All above | 9 |
| 4.10 | Refactor/document | All above | 10 |

---