# Truck Management System

A comprehensive truck fleet management solution built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## 🏗️ Architecture

This project follows a **feature-based architecture** with clear separation of concerns:

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with sidebar
│   ├── page.tsx                 # Dashboard page
│   ├── globals.css              # Global styles + shadcn/ui theme
│   ├── tyre-details/
│   │   └── page.tsx            # Tyre details route
│   ├── trip-sheet/
│   ├── payment-status/
│   └── setup/
│
├── features/                     # Feature-based organization
│   ├── dashboard/
│   │   ├── actions/             # Server Actions
│   │   │   └── index.ts
│   │   └── components/          # Feature-specific components
│   │       └── dashboard-view.tsx
│   │
│   ├── trucks/
│   │   ├── actions/             # CRUD operations
│   │   ├── components/          # Truck-specific components
│   │   └── schema/              # Zod validation schemas
│   │
│   ├── drivers/
│   │   ├── actions/
│   │   ├── components/
│   │   └── schema/
│   │
│   ├── trips/
│   │   ├── actions/
│   │   ├── components/
│   │   └── schema/
│   │
│   └── tyres/
│       ├── actions/
│       ├── components/
│       └── schema/
│
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   └── sidebar.tsx              # App-level shared components
│
└── lib/
    ├── supabase/
    │   ├── client.ts            # Client-side Supabase (anon key + RLS)
    │   ├── server.ts            # Server-side Supabase (service role key)
    │   └── types.ts             # Database type definitions
    └── utils.ts                 # Utility functions (cn, etc.)

supabase/
└── migrations/                   # SQL migration files
    └── 20240101000000_initial_schema.sql
```

## 🛠️ Tech Stack

### Core
- **Next.js 16** - Full-stack React framework (App Router)
- **TypeScript** - Type-safe development
- **React 19** - Latest React features

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality, customizable UI components
- **Radix UI** - Unstyled, accessible component primitives

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication (future)
  - Storage (future)

### Validation & Forms
- **Zod** - TypeScript-first schema validation
- Server Actions for mutations

## 📋 Features

### Current Features
- **Dashboard**: Overview of revenue, active trips, pending payments, and expenses
- **Tyre Management**: Track tyre fitment, removal, and performance metrics
- **Trucks**: Manage truck fleet and maintenance schedules
- **Drivers**: Driver information and assignments
- **Trips**: Trip sheet management with loads and expenses

### Architecture Highlights

#### 1. Feature-Based Structure
Each feature (trucks, trips, tyres, etc.) is self-contained with:
- **Actions**: Server-side data mutations with Zod validation
- **Components**: Feature-specific UI components
- **Schema**: Type-safe validation and TypeScript types

#### 2. Server Actions Pattern
All data mutations go through Server Actions:
```typescript
// src/features/trucks/actions/index.ts
"use server"

export async function createTruck(input: CreateTruck) {
  const validated = createTruckSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: "Invalid input" }
  }
  
  const { data, error } = await supabaseAdmin
    .from("trucks")
    .insert(validated.data)
    .select()
    .single()
  
  revalidatePath("/trucks")
  return { success: true, data }
}
```

#### 3. Type Safety with Zod
All schemas are defined with Zod and automatically generate TypeScript types:
```typescript
// src/features/trucks/schema/index.ts
export const truckSchema = z.object({
  id: z.string().uuid().optional(),
  truck_no: z.string().min(1, "Truck number is required"),
  fc_expiry: z.string().nullable().optional(),
  // ...
})

export type Truck = z.infer<typeof truckSchema>
```

#### 4. RLS-Based Security
Database security is enforced at the database level using Supabase RLS:
- Client components use the anon key
- Server Actions use the service role key for privileged operations
- All policies defined in SQL migrations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (or 20+)
- pnpm (or npm/yarn)
- Supabase account

### Installation

1. **Install dependencies:**
```bash
pnpm install
```

2. **Set up environment variables:**
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. **Run database migrations:**
Execute the SQL in `supabase/migrations/20240101000000_initial_schema.sql` in your Supabase SQL editor.

4. **Start development server:**
```bash
pnpm dev
```

5. **Open the app:**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Development Guidelines

### Adding a New Feature

1. **Create feature directory structure:**
```bash
src/features/my-feature/
├── actions/
│   └── index.ts
├── components/
│   └── my-feature-view.tsx
└── schema/
    └── index.ts
```

2. **Define Zod schema:**
```typescript
// src/features/my-feature/schema/index.ts
import { z } from "zod"

export const myFeatureSchema = z.object({
  // ... fields
})

export type MyFeature = z.infer<typeof myFeatureSchema>
```

3. **Create Server Actions:**
```typescript
// src/features/my-feature/actions/index.ts
"use server"

import { supabaseAdmin } from "@/lib/supabase/server"

export async function getMyFeatures() {
  // ...
}
```

4. **Build components:**
```typescript
// src/features/my-feature/components/my-feature-view.tsx
"use client"

export function MyFeatureView() {
  // ...
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

### Database Changes

1. Create a new migration file in `supabase/migrations/`
2. Name it with timestamp: `YYYYMMDDHHMMSS_description.sql`
3. Include both schema changes and RLS policies
4. Apply in Supabase SQL editor

## 🔐 Security

- **RLS Policies**: All tables have Row Level Security enabled
- **Server Actions**: Data mutations validated with Zod before database operations
- **Type Safety**: End-to-end type safety from database to UI
- **Environment Variables**: Sensitive keys stored in `.env.local` (not committed)

## 📦 Project Structure Rationale

### Why Feature-Based?
- **Scalability**: Easy to add new features without affecting existing code
- **Maintainability**: Related code is co-located
- **Team Collaboration**: Different features can be worked on independently
- **Clear Boundaries**: Each feature has its own actions, components, and schemas

### Why Server Actions?
- **Type Safety**: Full TypeScript support
- **Security**: Server-side validation and authorization
- **Performance**: Automatic code splitting
- **DX**: No need to create API routes for simple mutations

### Why Zod?
- **Runtime Validation**: Catch errors before they hit the database
- **Type Generation**: Single source of truth for types
- **Developer Experience**: Clear error messages and autocomplete

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) components, which are:
- Built on Radix UI primitives
- Fully accessible (ARIA compliant)
- Customizable with Tailwind CSS
- Copy-paste friendly (not an npm package)

To add more shadcn/ui components:
```bash
npx shadcn@latest add [component-name]
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please follow the existing architecture patterns.
