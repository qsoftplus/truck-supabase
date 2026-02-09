import { z } from "zod"

export const driverSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Driver name is required"),
  phone: z.string().nullable().optional(),
  alt_phone: z.string().nullable().optional(),
  home_phone: z.string().nullable().optional(),
  license_no: z.string().nullable().optional(),
  aadhar_no: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  created_at: z.string().optional(),
})

export const createDriverSchema = driverSchema.omit({ id: true, created_at: true })
export const updateDriverSchema = driverSchema.partial().required({ id: true })

export type Driver = z.infer<typeof driverSchema>
export type CreateDriver = z.infer<typeof createDriverSchema>
export type UpdateDriver = z.infer<typeof updateDriverSchema>
