# Migration Guide: Old Structure → New Architecture

## 📌 Overview

This guide documents the migration from the old flat structure to the new feature-based architecture with best practices.

## 🔄 Key Changes

### 1. Directory Structure

**Before:**
```
/app
  /page.tsx
  /tyre-details/page.tsx
  /globals.css
  /layout.tsx
/components
  /Sidebar.tsx
/lib
  /supabase.ts
  /types.ts
  /utils.ts
```

**After:**
```
/src
  /app
    /page.tsx
    /tyre-details/page.tsx
    /globals.css
    /layout.tsx
  /features
    /dashboard
      /actions
      /components
    /tyres
      /actions
      /components
      /schema
    /trucks
      /actions
      /components
      /schema
  /components
    /ui          # shadcn/ui components
    /sidebar.tsx
  /lib
    /supabase
      /client.ts
      /server.ts
      /types.ts
    /utils.ts
/supabase
  /migrations
```

### 2. Import Path Changes

**Before:**
```typescript
import { supabase } from "@/lib/supabase"
import { Sidebar } from "@/components/Sidebar"
```

**After:**
```typescript
import { supabase } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
```

### 3. Page Structure

**Before (Mixed Client/Server):**
```typescript
// app/page.tsx
"use client"
export default function Home() {
  // Direct Supabase calls in component
  const { data } = await supabase.from('trucks').select()
  // ...
}
```

**After (Separated Concerns):**
```typescript
// src/app/page.tsx
import { DashboardView } from "@/features/dashboard/components/dashboard-view"

export default function HomePage() {
  return <DashboardView />
}

// src/features/dashboard/components/dashboard-view.tsx
"use client"
export function DashboardView() {
  // Component logic using server actions
}

// src/features/dashboard/actions/index.ts
"use server"
export async function getDashboardStats() {
  // Server-side data fetching
}
```

## 📋 Migration Checklist

### Phase 1: Infrastructure Setup ✅

- [x] Install new dependencies (Zod, Radix UI, shadcn/ui)
- [x] Create `src/` directory structure
- [x] Update `tsconfig.json` paths (`@/*` → `./src/*`)
- [x] Move and reorganize Supabase client files
- [x] Set up shadcn/ui components
- [x] Create utility functions (`cn`, etc.)

### Phase 2: Database & Types ✅

- [x] Move SQL schema to `supabase/migrations/`
- [x] Generate TypeScript types from schema
- [x] Create Zod schemas for all entities
- [x] Set up separate client/server Supabase instances

### Phase 3: Features Migration

#### Dashboard ✅
- [x] Create `src/features/dashboard/`
- [x] Migrate dashboard logic to server actions
- [x] Build `DashboardView` component with shadcn/ui
- [x] Update route in `src/app/page.tsx`

#### Tyres ✅
- [x] Create `src/features/tyres/`
- [x] Define Zod schemas
- [x] Create server actions (CRUD)
- [x] Build `TyreDetailsView` component
- [x] Update route in `src/app/tyre-details/page.tsx`

#### Trucks 🔄 (In Progress)
- [x] Create `src/features/trucks/`
- [x] Define Zod schemas
- [x] Create server actions
- [ ] Build truck management components
- [ ] Create route

#### Drivers 📝 (Pending)
- [x] Create `src/features/drivers/`
- [x] Define Zod schemas
- [ ] Create server actions
- [ ] Build driver management components
- [ ] Create route

#### Trips 📝 (Pending)
- [x] Create `src/features/trips/`
- [x] Define Zod schemas
- [ ] Create server actions
- [ ] Build trip sheet components
- [ ] Create route

### Phase 4: Cleanup

- [ ] Remove old `/app` directory (renamed to `app.old`)
- [ ] Remove old `/components` directory (renamed to `components.old`)
- [ ] Remove old `/lib` directory (renamed to `lib.old`)
- [ ] Verify all imports are using new paths
- [ ] Test all features
- [ ] Update `.gitignore` to exclude `.old` directories

## 🎯 Current Status

### ✅ Completed
1. **Infrastructure**: All base files and configurations are in place
2. **UI Components**: shadcn/ui components added (Button, Card, Input, Label)
3. **Type Safety**: Zod schemas created for all major entities
4. **Dashboard**: Fully migrated with server actions
5. **Tyres**: Fully migrated with server actions

### 🔄 In Progress
1. **Trucks Feature**: Schema and actions ready, need components
2. **Drivers Feature**: Schema ready, need actions and components
3. **Trips Feature**: Schema ready, need actions and components

### 📝 Pending
1. Complete remaining feature pages
2. Add authentication (Supabase Auth)
3. Implement proper error handling
4. Add loading states and skeletons
5. Set up proper RLS policies (currently open for development)
6. Add unit tests
7. Add E2E tests

## 🚀 Next Steps

### 1. Complete Trucks Management (Priority: High)
```typescript
// src/features/trucks/components/truck-list.tsx
// src/features/trucks/components/truck-form.tsx
// src/app/setup/trucks/page.tsx
```

### 2. Complete Drivers Management (Priority: High)
```typescript
// src/features/drivers/actions/index.ts
// src/features/drivers/components/driver-list.tsx
// src/features/drivers/components/driver-form.tsx
// src/app/setup/drivers/page.tsx
```

### 3. Build Trip Sheet (Priority: Medium)
```typescript
// src/features/trips/actions/index.ts
// src/features/trips/components/trip-form.tsx
// src/features/trips/components/load-form.tsx
// src/app/trip-sheet/page.tsx
```

### 4. Implement Authentication (Priority: Medium)
- Add Supabase Auth integration
- Create login/signup pages
- Add middleware for protected routes
- Update RLS policies to use `auth.uid()`

### 5. Production Readiness (Priority: Low)
- Secure RLS policies
- Add proper error boundaries
- Implement loading states
- Add toast notifications
- Performance optimization
- SEO optimization

## 🛠️ Development Guidelines

### Adding a New Feature

1. **Create feature structure:**
```bash
src/features/my-feature/
├── actions/
│   └── index.ts        # Server Actions
├── components/
│   ├── my-feature-view.tsx
│   └── my-feature-form.tsx
└── schema/
    └── index.ts        # Zod schemas
```

2. **Define schema first:**
```typescript
// src/features/my-feature/schema/index.ts
import { z } from "zod"

export const myFeatureSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  // ... other fields
})

export type MyFeature = z.infer<typeof myFeatureSchema>
```

3. **Create server actions:**
```typescript
// src/features/my-feature/actions/index.ts
"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { createMyFeatureSchema } from "../schema"

export async function createMyFeature(input: CreateMyFeature) {
  const validated = createMyFeatureSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: "Invalid input" }
  }
  
  const { data, error } = await supabaseAdmin
    .from("my_features")
    .insert(validated.data)
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath("/my-features")
  return { success: true, data }
}
```

4. **Build components:**
```typescript
// src/features/my-feature/components/my-feature-view.tsx
"use client"

import { createMyFeature } from "../actions"

export function MyFeatureView() {
  // Component implementation
}
```

5. **Create route:**
```typescript
// src/app/my-feature/page.tsx
import { MyFeatureView } from "@/features/my-feature/components/my-feature-view"

export default function MyFeaturePage() {
  return <MyFeatureView />
}
```

## 📚 References

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase](https://supabase.com/docs)
- [Zod](https://zod.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🐛 Troubleshooting

### Issue: Import errors after migration
**Solution**: Clear `.next` cache and restart dev server:
```bash
Remove-Item -Path ".next" -Recurse -Force
pnpm dev
```

### Issue: Type errors with Supabase
**Solution**: Regenerate types from your Supabase schema:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
```

### Issue: shadcn/ui components not found
**Solution**: Make sure `components.json` is configured correctly and paths in `tsconfig.json` point to `./src/*`

## ✅ Final Checklist Before Production

- [ ] All features migrated and tested
- [ ] Authentication implemented
- [ ] RLS policies secured
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Toast notifications added
- [ ] Forms validated with Zod
- [ ] Database migrations organized
- [ ] Environment variables documented
- [ ] README updated
- [ ] Tests written and passing
- [ ] Performance optimized
- [ ] SEO implemented
- [ ] Accessibility checked
