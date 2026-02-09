import { z } from "zod"

export const tyreSchema = z.object({
  id: z.string().uuid().optional(),
  truck_id: z.string().uuid("Valid truck is required"),
  make: z.string().nullable().optional(),
  price: z.number().min(0, "Price must be positive").default(0),
  fitment_date: z.string().nullable().optional(),
  fitting_km: z.number().nullable().optional(),
  removal_date: z.string().nullable().optional(),
  removal_km: z.number().nullable().optional(),
  remarks: z.string().nullable().optional(),
  created_at: z.string().optional(),
})

export const createTyreSchema = tyreSchema.omit({ id: true, created_at: true })
export const updateTyreSchema = tyreSchema.partial().required({ id: true })

export type Tyre = z.infer<typeof tyreSchema>
export type CreateTyre = z.infer<typeof createTyreSchema>
export type UpdateTyre = z.infer<typeof updateTyreSchema>
