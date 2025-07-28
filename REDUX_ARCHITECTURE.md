# Redux Architecture Documentation

## Overview

This pharmacy management system uses **Redux Toolkit (RTK)** with **RTK Query** for centralized state management. This provides:

- **Centralized State**: All app state managed in one place
- **API State Management**: Automatic caching, invalidation, and synchronization
- **Type Safety**: Full TypeScript support throughout
- **Developer Experience**: Redux DevTools integration
- **Performance**: Optimized re-renders and caching

## Architecture Structure

```
src/
├── lib/
│   └── store/
│       ├── index.ts                    # Main store configuration
│       ├── api/
│       │   ├── pharmacyApi.ts          # API slice with all endpoints
│       │   └── mockAdapter.ts          # Mock data for development
│       ├── slices/
│       │   └── uiSlice.ts              # UI state management
│       └── providers/
│           └── StoreProvider.tsx       # Redux provider component
└── components/
    └── ui/
        └── NotificationToast.tsx       # Notification system
```

## Store Configuration

### Main Store (`lib/store/index.ts`)

```typescript
export const store = configureStore({
  reducer: {
    ui: uiReducer,                      // UI state (modals, notifications, etc.)
    [pharmacyApi.reducerPath]: pharmacyApi.reducer, // API state
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(pharmacyApi.middleware),
})
```

**Features:**
- **Typed Hooks**: `useAppDispatch()`, `useAppSelector()`
- **RTK Query Integration**: Automatic API state management
- **TypeScript Support**: Full type safety with `RootState` and `AppDispatch`

## API State Management

### Pharmacy API Slice (`lib/store/api/pharmacyApi.ts`)

**Endpoints:**
- **Purchases**: CRUD operations for medicine purchases
- **Medicines**: Medicine master data management
- **Suppliers**: Supplier information management
- **Inventory**: Stock level tracking and updates
- **Expiry Tracking**: Medicine expiry monitoring
- **Dashboard**: Statistics and recent activity

**Key Features:**
- **Automatic Caching**: Data cached automatically
- **Tag-based Invalidation**: Smart cache invalidation
- **Loading States**: Built-in loading/error states
- **Optimistic Updates**: UI updates before server response

### Example Usage

```typescript
// In a component
const { data: purchases, isLoading, error } = useGetPurchasesQuery({ page: 1 })
const [createPurchase, { isLoading: isCreating }] = useCreatePurchaseMutation()

// Creating a purchase
const handleSubmit = async (formData) => {
  try {
    await createPurchase(formData).unwrap()
    // Success notification automatically handled
  } catch (error) {
    // Error notification automatically handled
  }
}
```

## UI State Management

### UI Slice (`lib/store/slices/uiSlice.ts`)

**State Managed:**
- **Modals**: Purchase entry, medicine entry, supplier entry
- **Loading States**: Global, purchases, inventory, expiry
- **Notifications**: Success, error, warning, info messages
- **Filters**: Search and filter states for different pages
- **Sidebar**: Mobile sidebar state

**Actions Available:**
```typescript
// Modal management
dispatch(openModal('purchaseEntry'))
dispatch(closeModal('purchaseEntry'))

// Notifications
dispatch(addNotification({
  type: 'success',
  title: 'Success',
  message: 'Purchase saved successfully!'
}))

// Filters
dispatch(setPurchaseFilter({ supplier: 'MedPlus' }))
```

## Component Integration

### Using Redux in Components

```typescript
'use client'

import { useAppDispatch, useAppSelector } from '@/lib/store'
import { useCreatePurchaseMutation } from '@/lib/store/api/pharmacyApi'
import { addNotification, openModal } from '@/lib/store/slices/uiSlice'

export default function MyComponent() {
  const dispatch = useAppDispatch()
  const isModalOpen = useAppSelector((state) => state.ui.modals.purchaseEntry)
  const [createPurchase, { isLoading }] = useCreatePurchaseMutation()

  const handleAction = async () => {
    try {
      await createPurchase(data).unwrap()
      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: 'Action completed!'
      }))
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Action failed!'
      }))
    }
  }

  return (
    // Component JSX
  )
}
```

## API Integration Patterns

### 1. Query Hooks (Read Operations)

```typescript
// Basic query
const { data, isLoading, error } = useGetPurchasesQuery()

// Query with parameters
const { data } = useGetExpiryAlertsQuery({ days: 30 })

// Conditional queries
const { data } = useGetPurchaseByIdQuery(id, {
  skip: !id // Only run if id exists
})
```

### 2. Mutation Hooks (Write Operations)

```typescript
const [createPurchase, { 
  isLoading: isCreating,
  error: createError 
}] = useCreatePurchaseMutation()

// Execute mutation
const result = await createPurchase(data).unwrap()
```

### 3. Cache Management

**Automatic Invalidation:**
```typescript
createPurchase: builder.mutation({
  query: (purchase) => ({ /* ... */ }),
  invalidatesTags: ['Purchase', 'Inventory', 'Expiry'] // Auto-refresh related data
})
```

**Manual Cache Updates:**
```typescript
// Optimistic updates
onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
  const patchResult = dispatch(
    pharmacyApi.util.updateQueryData('getPurchases', undefined, (draft) => {
      draft.push(arg)
    })
  )
  try {
    await queryFulfilled
  } catch {
    patchResult.undo()
  }
}
```

## Notification System

### Toast Notifications (`components/ui/NotificationToast.tsx`)

**Features:**
- **Auto-dismiss**: Configurable timeout
- **Types**: Success, Error, Warning, Info
- **Dismissible**: Manual close option
- **Queue Management**: Multiple notifications

**Usage:**
```typescript
dispatch(addNotification({
  type: 'success',
  title: 'Purchase Saved',
  message: 'Purchase from MedPlus saved successfully!',
  duration: 5000 // Optional, defaults to 5000ms
}))
```

## Development & Production Setup

### Mock Data (`lib/store/api/mockAdapter.ts`)

For development without backend:
```typescript
export const mockApi = {
  async getPurchases() {
    await this.delay() // Simulate network delay
    return mockPurchases
  }
  // ... other mock methods
}
```

### API Routes (`app/api/`)

Sample Next.js API routes for backend integration:
- `/api/purchases` - Purchase CRUD operations
- `/api/dashboard/stats` - Dashboard statistics
- `/api/inventory` - Inventory management
- `/api/expiry/alerts` - Expiry tracking

## Best Practices Implemented

### 1. **Type Safety**
- All state and API responses fully typed
- TypeScript interfaces for all data structures
- Typed hooks for dispatch and selectors

### 2. **Performance**
- RTK Query automatic caching
- Tag-based cache invalidation
- Optimized component re-renders

### 3. **Error Handling**
- Centralized error state management
- User-friendly error notifications
- Automatic retry mechanisms

### 4. **Loading States**
- Per-operation loading states
- Global loading indicators
- Skeleton loading components

### 5. **Data Consistency**
- Automatic cache synchronization
- Optimistic updates where appropriate
- Rollback on errors

## Usage Examples

### Purchase Entry Flow

```typescript
// 1. Open modal
dispatch(openModal('purchaseEntry'))

// 2. Submit form
const handleSubmit = async (formData) => {
  try {
    // 3. Create purchase (auto-invalidates cache)
    await createPurchase(transformedData).unwrap()
    
    // 4. Show success notification
    dispatch(addNotification({
      type: 'success',
      title: 'Purchase Saved',
      message: `Purchase from ${formData.supplier_name} saved!`
    }))
    
    // 5. Close modal
    dispatch(closeModal('purchaseEntry'))
  } catch (error) {
    // 6. Handle errors
    dispatch(addNotification({
      type: 'error',
      title: 'Error',
      message: 'Failed to save purchase'
    }))
  }
}
```

### Dashboard Data Loading

```typescript
// Automatic data fetching
const { data, isLoading, error } = useGetDashboardStatsQuery()

// Loading state
if (isLoading) return <LoadingSkeleton />

// Error state
if (error) return <ErrorMessage />

// Success state
return <DashboardStats data={data} />
```

## Extending the System

### Adding New API Endpoints

1. **Add to API slice:**
```typescript
// In pharmacyApi.ts
getNewEndpoint: builder.query<ResponseType, RequestType>({
  query: (params) => `new-endpoint?${params}`,
  providesTags: ['NewTag'],
})
```

2. **Export hook:**
```typescript
export const { useGetNewEndpointQuery } = pharmacyApi
```

3. **Use in component:**
```typescript
const { data } = useGetNewEndpointQuery(params)
```

### Adding New UI State

1. **Add to UI slice:**
```typescript
// In uiSlice.ts interface
newFeature: {
  isEnabled: boolean
  settings: object
}

// In reducers
setNewFeature: (state, action) => {
  state.newFeature = action.payload
}
```

2. **Use in component:**
```typescript
const newFeature = useAppSelector((state) => state.ui.newFeature)
dispatch(setNewFeature(newValue))
```

This architecture provides a robust, scalable foundation for the pharmacy management system with excellent developer experience and performance characteristics. 