# Veeda Wallet Mobile App – Phase 2 Implementation Plan

## Overview

This document details the implementation plan for **Phase 2: Core Architecture & State Management** of the Veeda Wallet mobile app, as outlined in the main implementation plan. It incorporates your preferences for using both Riverpod and get_it for dependency injection, RFC-aligned models, repository interfaces in `core/` with implementations in subfolders, and centralized Riverpod providers.

---

## 1. Set Up Dependency Injection (DI)

- **Approach:** Use both Riverpod and get_it.
  - Riverpod for state management and global providers.
  - get_it for service locator pattern (repositories, storage, etc.).
- **Steps:**
  - Add `get_it` and `riverpod` to `pubspec.yaml` if not present.
  - In `lib/core/di/`:
    - Create `service_locator.dart` for get_it setup and registration.
    - Create `providers.dart` for Riverpod global providers (auth, transactions, dashboard, UI state).
  - Register all repositories and services in get_it and expose via Riverpod providers.

---

## 2. Define Data Models

- **Location:** `lib/core/models/`
- **Models:**
  - `Transaction` (fields: id, userId, amount, category, note, date, createdAt, updatedAt, etc.)
  - `User` (fields: id, email, name, createdAt, updatedAt, etc.)
  - Additional models as required by the RFC.
- **Requirements:**
  - Models must be compatible with Isar (local DB) and Supabase (cloud).
  - Implement serialization/deserialization for both Isar and Supabase.
  - Use Isar annotations (e.g., `@Collection`) and JSON serialization (e.g., `json_serializable`).

---

## 3. Abstract Data Sources (Repository Pattern)

- **Location:** 
  - Interfaces: `lib/core/`
  - Implementations: `lib/core/storage/` (local), `lib/core/supabase/` (stubbed for now)
- **Steps:**
  - Define abstract repository interfaces:
    - `AuthRepository` (login, logout, signup, getCurrentUser, etc.)
    - `TransactionRepository` (getTransactions, addTransaction, updateTransaction, deleteTransaction, etc.)
  - Implement local repositories using Isar and flutter_secure_storage in `storage/`.
  - Stub Supabase repositories in `supabase/` for future integration.
  - Register all repositories in get_it and expose via Riverpod providers.

---

## 4. Implement State Management (Riverpod Providers)

- **Location:** `lib/core/di/providers.dart`
- **Providers:**
  - Auth state/session provider (tracks current user, auth status)
  - Transaction list provider (fetches and manages transactions)
  - Dashboard summaries provider (aggregates transaction data for summary cards)
  - UI state provider (modals, navigation, etc.)
- **Best Practices:**
  - Use `StateNotifier`/`StateNotifierProvider` for complex state.
  - Use `Provider`/`AsyncValue` for simple or async state.
  - Ensure providers are testable and decoupled from UI.

---

## Directory Structure

```
lib/
  core/
    di/
      service_locator.dart
      providers.dart
    models/
      transaction.dart
      user.dart
      ...
    storage/
      local_auth_repository.dart
      local_transaction_repository.dart
      ...
    supabase/
      supabase_auth_repository.dart (stub)
      supabase_transaction_repository.dart (stub)
    ...
  features/
    ...
  shared/
    ...
```

---

## High-Level Architecture (Mermaid Diagram)

```mermaid
flowchart TD
    subgraph DI
      A[service_locator.dart (get_it)]
      B[providers.dart (Riverpod)]
    end
    subgraph Data
      C[AuthRepository (abstract)]
      D[TransactionRepository (abstract)]
      E[LocalAuthRepository (Isar/SecureStorage)]
      F[LocalTransactionRepository (Isar)]
      G[SupabaseAuthRepository (stub)]
      H[SupabaseTransactionRepository (stub)]
    end
    subgraph State
      I[AuthProvider]
      J[TransactionListProvider]
      K[DashboardSummaryProvider]
      L[UIStateProvider]
    end
    A --> E
    A --> F
    A --> G
    A --> H
    B --> I
    B --> J
    B --> K
    B --> L
    I --> C
    J --> D
    K --> D
    E --> C
    F --> D
    G --> C
    H --> D
```

---

## Milestones & Deliverables

1. **DI Setup:** `service_locator.dart` and `providers.dart` created and wired up.
2. **Models:** `Transaction` and `User` models implemented, tested for Isar/Supabase compatibility.
3. **Repositories:** Abstract interfaces and local implementations complete; Supabase stubs in place.
4. **Providers:** All required Riverpod providers implemented and exposed.

---