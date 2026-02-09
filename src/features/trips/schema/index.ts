import { z } from "zod"

export const tripSchema = z.object({
  id: z.string().uuid().optional(),
  truck_id: z.string().uuid("Truck is required"),
  driver1_id: z.string().uuid("Primary driver is required"),
  driver2_id: z.string().uuid().nullable().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().nullable().optional(),
  start_km: z.coerce.number().min(0, "Start KM must be positive"),
  end_km: z.coerce.number().min(0).nullable().optional(),
  diesel_amount: z.coerce.number().min(0).default(0),
  diesel_liters: z.coerce.number().min(0).default(0),
  status: z.enum(["ongoing", "completed"]).default("ongoing"),
  created_at: z.string().optional(),
})

export const loadSchema = z.object({
  id: z.string().uuid().optional(),
  trip_id: z.string().uuid(),
  loading_date: z.string().nullable().optional(),
  from_location: z.string().nullable().optional(),
  to_location: z.string().nullable().optional(),
  transporter: z.string().nullable().optional(),
  freight_amount: z.coerce.number().min(0).default(0),
  note: z.string().nullable().optional(),
  pay_term: z.enum(["To Pay", "Advance"]).default("To Pay"),
  advance_amount: z.coerce.number().min(0).default(0),
  balance_amount: z.coerce.number().min(0).default(0),
})

export const expenseSchema = z.object({
  id: z.string().uuid().optional(),
  trip_id: z.string().uuid(),
  category: z.string().min(1, "Category is required"),
  title: z.string().nullable().optional(),
  amount: z.coerce.number().min(0).default(0),
  liters: z.coerce.number().nullable().optional(),
  percentage: z.coerce.number().nullable().optional(),
})

export const createTripSchema = tripSchema.omit({ id: true, created_at: true })
export const updateTripSchema = tripSchema.partial().required({ id: true })

export const createLoadSchema = loadSchema.omit({ id: true })
export const updateLoadSchema = loadSchema.partial().required({ id: true })

export const createExpenseSchema = expenseSchema.omit({ id: true })
export const updateExpenseSchema = expenseSchema.partial().required({ id: true })

export type Trip = z.infer<typeof tripSchema>
export type CreateTrip = z.infer<typeof createTripSchema>
export type UpdateTrip = z.infer<typeof updateTripSchema>

export type Load = z.infer<typeof loadSchema>
export type CreateLoad = z.infer<typeof createLoadSchema>
export type UpdateLoad = z.infer<typeof updateLoadSchema>

export type Expense = z.infer<typeof expenseSchema>
export type CreateExpense = z.infer<typeof createExpenseSchema>
export type UpdateExpense = z.infer<typeof updateExpenseSchema>
