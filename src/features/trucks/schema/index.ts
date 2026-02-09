import { z } from "zod"

export const truckSchema = z.object({
  id: z.string().uuid().optional(),
  truck_no: z.string().min(1, "Truck number is required"),
  created_at: z.string().optional(),
})

export const createTruckSchema = truckSchema.omit({ id: true, created_at: true })
export const updateTruckSchema = truckSchema.partial().required({ id: true })

// Schema for multi-add trucks (array of truck numbers)
export const createMultipleTrucksSchema = z.object({
  trucks: z.array(z.object({
    truck_no: z.string().min(1, "Truck number is required"),
  })).min(1, "At least one truck is required"),
})

export type Truck = z.infer<typeof truckSchema>
export type CreateTruck = z.infer<typeof createTruckSchema>
export type UpdateTruck = z.infer<typeof updateTruckSchema>
export type CreateMultipleTrucks = z.infer<typeof createMultipleTrucksSchema>
