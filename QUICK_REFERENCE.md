# 🚀 Quick Reference Guide

## 📁 Project Structure

```
src/
├── app/                    # Next.js routes
├── features/               # Feature modules
│   ├── dashboard/
│   ├── trucks/
│   ├── drivers/
│   ├── trips/
│   └── tyres/
├── components/
│   ├── ui/                # shadcn/ui components
│   └── sidebar.tsx
└── lib/
    ├── supabase/
    └── utils.ts
```

## 🔑 Key Commands

### Development
```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linter
```

### Database
```bash
# Run migrations in Supabase SQL Editor
# File: supabase/migrations/20240101000000_initial_schema.sql
```

### shadcn/ui
```bash
npx shadcn@latest add button     # Add Button component
npx shadcn@latest add card       # Add Card component
npx shadcn@latest add input      # Add Input component
npx shadcn@latest add [component-name]
```

## 🎯 Common Tasks

### 1. Create a New Feature

```typescript
// 1. Schema (src/features/my-feature/schema/index.ts)
import { z } from "zod"

export const myFeatureSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
})

export type MyFeature = z.infer<typeof myFeatureSchema>
```

```typescript
// 2. Actions (src/features/my-feature/actions/index.ts)
"use server"

import { supabaseAdmin } from "@/lib/supabase/server"

export async function getMyFeatures() {
  const { data, error } = await supabaseAdmin
    .from("my_features")
    .select("*")
  
  return { success: !error, data, error: error?.message }
}
```

```typescript
// 3. Component (src/features/my-feature/components/my-feature-view.tsx)
"use client"

import { getMyFeatures } from "../actions"

export function MyFeatureView() {
  // Your component logic
}
```

```typescript
// 4. Route (src/app/my-feature/page.tsx)
import { MyFeatureView } from "@/features/my-feature/components/my-feature-view"

export default function Page() {
  return <MyFeatureView />
}
```

### 2. Use Server Actions

```typescript
// In a client component
"use client"

import { createTruck } from "@/features/trucks/actions"

export function TruckForm() {
  async function handleSubmit(data: CreateTruck) {
    const result = await createTruck(data)
    
    if (result.success) {
      // Handle success
    } else {
      // Handle error
      console.error(result.error)
    }
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### 3. Access Supabase

```typescript
// Client-side (with RLS)
import { supabase } from "@/lib/supabase/client"

const { data } = await supabase.from("trucks").select("*")
```

```typescript
// Server-side (bypasses RLS)
"use server"

import { supabaseAdmin } from "@/lib/supabase/server"

const { data } = await supabaseAdmin.from("trucks").select("*")
```

### 4. Validate with Zod

```typescript
import { truckSchema } from "./schema"

const result = truckSchema.safeParse(input)

if (!result.success) {
  console.error(result.error.issues)
  return
}

// result.data is now type-safe
```

### 5. Use shadcn/ui Components

```typescript
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

## 🔒 Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📋 File Naming Conventions

- **Components**: PascalCase (`DashboardView.tsx`, `TruckForm.tsx`)
- **Actions**: kebab-case files, camelCase functions (`index.ts` with `getTrucks()`)
- **Routes**: kebab-case directories (`trip-sheet/`, `tyre-details/`)
- **Schemas**: camelCase exports (`truckSchema`, `createTruckSchema`)

## 🎨 Styling

### Using cn() utility
```typescript
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className // Allow override
)} />
```

### Tailwind Classes
```typescript
// Responsive
className="text-sm md:text-base lg:text-lg"

// States
className="hover:bg-slate-100 focus:ring-2"

// Dark mode (when implemented)
className="bg-white dark:bg-slate-900"
```

## 🚨 Common Pitfalls

### 1. Server Actions must use "use server"
```typescript
"use server"  // ← Required!

export async function myAction() {
  // ...
}
```

### 2. Client components must use "use client"
```typescript
"use client"  // ← Required if using hooks, state, etc.

export function MyComponent() {
  const [state, setState] = useState()
  // ...
}
```

### 3. Import paths
```typescript
// ✅ Correct
import { supabase } from "@/lib/supabase/client"

// ❌ Wrong
import { supabase } from "@/lib/supabase"
```

### 4. Zod validation in Server Actions
```typescript
export async function createTruck(input: CreateTruck) {
  // ✅ Always validate
  const validated = createTruckSchema.safeParse(input)
  
  if (!validated.success) {
    return { success: false, error: "Invalid input" }
  }
  
  // Use validated.data, not input
  const { data } = await supabaseAdmin
    .from("trucks")
    .insert(validated.data)
}
```

## 📚 Useful Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Zod Documentation](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🐛 Debugging

### Clear Next.js cache
```bash
Remove-Item -Path ".next" -Recurse -Force
pnpm dev
```

### Check type errors
```bash
pnpm build
```

### View build output
```bash
pnpm build --debug
```

## 📊 Current Routes

- `/` - Dashboard
- `/tyre-details` - Tyre management
- `/trip-sheet` - Trip sheets (placeholder)
- `/payment-status` - Payment tracking (placeholder)
- `/setup` - System setup (placeholder)

## ✅ Next Steps

1. Complete truck management UI
2. Complete driver management UI
3. Build trip sheet functionality
4. Add authentication
5. Implement proper RLS policies
6. Add error handling and toasts
