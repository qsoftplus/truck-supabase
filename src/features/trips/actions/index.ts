"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/server"
import { 
  createTripSchema, updateTripSchema, 
  createLoadSchema, updateLoadSchema, 
  createExpenseSchema, updateExpenseSchema
} from "../schema"

// --- HELPER: Get existing trips for a truck to validate dates ---
export async function getTripsByTruckId(truckId: string) {
  const { data, error } = await supabaseAdmin
    .from("trips")
    .select("id, start_date, end_date, status")
    .eq("truck_id", truckId)
    .order("start_date", { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

// Validate trip dates for a specific truck
export async function validateTripDates(
  truckId: string, 
  startDate: string, 
  endDate: string | null,
  excludeTripId?: string // for updates, exclude current trip
) {
  const result = await getTripsByTruckId(truckId)
  if (!result.success || !result.data) {
    return { valid: true } // If no trips exist, any date is valid
  }

  const existingTrips = result.data.filter(t => t.id !== excludeTripId)
  
  const newStart = new Date(startDate)
  const newEnd = endDate ? new Date(endDate) : null

  for (const trip of existingTrips) {
    const tripStart = new Date(trip.start_date)
    const tripEnd = trip.end_date ? new Date(trip.end_date) : null

    // Check if dates overlap
    if (tripEnd) {
      // Trip has ended
      if (newStart <= tripEnd && (!newEnd || newEnd >= tripStart)) {
        return { 
          valid: false, 
          error: `This truck has an existing trip from ${trip.start_date} to ${trip.end_date}. New trip dates cannot overlap.`
        }
      }
    } else {
      // Trip is ongoing (no end date)
      if (!newEnd || newEnd >= tripStart) {
        // Check if new start is after ongoing trip start
        if (newStart <= tripStart) {
          return { 
            valid: false, 
            error: `This truck has an ongoing trip starting ${trip.start_date}. Please complete that trip first or choose dates after it.`
          }
        }
      }
    }
  }

  // Validate that start date is before or equal to end date
  if (newEnd && newStart > newEnd) {
    return { valid: false, error: "Start date cannot be after end date" }
  }

  return { valid: true }
}

// Validate loading date is within trip date range
export async function validateLoadingDate(
  tripId: string,
  loadingDate: string
) {
  const { data: trip, error } = await supabaseAdmin
    .from("trips")
    .select("start_date, end_date")
    .eq("id", tripId)
    .single()

  if (error || !trip) {
    return { valid: false, error: "Trip not found" }
  }

  const loadDate = new Date(loadingDate)
  const startDate = new Date(trip.start_date)
  const endDate = trip.end_date ? new Date(trip.end_date) : null

  if (loadDate < startDate) {
    return { valid: false, error: `Loading date cannot be before trip start date (${trip.start_date})` }
  }

  if (endDate && loadDate > endDate) {
    return { valid: false, error: `Loading date cannot be after trip end date (${trip.end_date})` }
  }

  return { valid: true }
}

// --- TRIPS ---

export async function getTrips() {
  const { data, error } = await supabaseAdmin
    .from("trips")
    .select(`
      *,
      trucks (id, truck_no),
      driver1:drivers!driver1_id (id, name),
      driver2:drivers!driver2_id (id, name),
      loads (*),
      expenses (*)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching trips:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getTripById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("trips")
    .select(`
      *,
      trucks (id, truck_no),
      driver1:drivers!driver1_id (id, name),
      driver2:drivers!driver2_id (id, name),
      loads (*),
      expenses (*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching trip:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createTrip(input: any) {
  const validated = createTripSchema.safeParse(input)
  if (!validated.success) return { success: false, error: "Invalid input", issues: validated.error.issues }

  // Validate trip dates don't overlap with existing trips for this truck
  const dateValidation = await validateTripDates(
    validated.data.truck_id, 
    validated.data.start_date, 
    validated.data.end_date || null
  )
  
  if (!dateValidation.valid) {
    return { success: false, error: dateValidation.error }
  }

  const { data, error } = await supabaseAdmin.from("trips").insert(validated.data).select().single()

  if (error) return { success: false, error: error.message }
  revalidatePath("/trip-sheet")
  return { success: true, data }
}

export async function updateTrip(input: any) {
  const validated = updateTripSchema.safeParse(input)
  if (!validated.success) return { success: false, error: "Invalid input" }

  const { id, ...updates } = validated.data

  // If dates are being updated, validate them
  if (updates.truck_id || updates.start_date || updates.end_date !== undefined) {
    // Get existing trip to get truck_id if not provided
    const { data: existingTrip } = await supabaseAdmin
      .from("trips")
      .select("truck_id, start_date, end_date")
      .eq("id", id)
      .single()

    if (existingTrip) {
      const truckId = updates.truck_id || existingTrip.truck_id
      const startDate = updates.start_date || existingTrip.start_date
      const endDate = updates.end_date !== undefined ? updates.end_date : existingTrip.end_date

      const dateValidation = await validateTripDates(truckId, startDate, endDate, id)
      
      if (!dateValidation.valid) {
        return { success: false, error: dateValidation.error }
      }
    }
  }

  const { data, error } = await supabaseAdmin.from("trips").update(updates).eq("id", id).select().single()

  if (error) return { success: false, error: error.message }
  revalidatePath("/trip-sheet")
  return { success: true, data }
}

export async function deleteTrip(id: string) {
  const { error } = await supabaseAdmin.from("trips").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidatePath("/trip-sheet")
  return { success: true }
}

// --- LOADS ---

export async function getLoadsByTripId(tripId: string) {
  const { data, error } = await supabaseAdmin
    .from("loads")
    .select("*")
    .eq("trip_id", tripId)
    .order("loading_date", { ascending: true })
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function createLoad(input: any) {
  const validated = createLoadSchema.safeParse(input)
  if (!validated.success) return { success: false, error: "Invalid input", issues: validated.error.issues }

  // Validate loading date if provided
  if (validated.data.loading_date) {
    const dateValidation = await validateLoadingDate(validated.data.trip_id, validated.data.loading_date)
    if (!dateValidation.valid) {
      return { success: false, error: dateValidation.error }
    }
  }

  const { data, error } = await supabaseAdmin.from("loads").insert(validated.data).select().single()
  if (error) return { success: false, error: error.message }
  revalidatePath("/trip-sheet")
  return { success: true, data }
}

export async function updateLoad(input: any) {
  const validated = updateLoadSchema.safeParse(input)
  if (!validated.success) return { success: false, error: "Invalid input" }

  const { id, ...updates } = validated.data

  // If loading date is being updated, validate it
  if (updates.loading_date) {
    // Get trip_id for validation
    const { data: existingLoad } = await supabaseAdmin
      .from("loads")
      .select("trip_id")
      .eq("id", id)
      .single()

    if (existingLoad) {
      const dateValidation = await validateLoadingDate(existingLoad.trip_id, updates.loading_date)
      if (!dateValidation.valid) {
        return { success: false, error: dateValidation.error }
      }
    }
  }

  const { data, error } = await supabaseAdmin.from("loads").update(updates).eq("id", id).select().single()
  if (error) return { success: false, error: error.message }
  revalidatePath("/trip-sheet")
  return { success: true, data }
}

export async function deleteLoad(id: string) {
  const { error } = await supabaseAdmin.from("loads").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidatePath("/trip-sheet")
  return { success: true }
}

// --- EXPENSES ---

export async function getExpensesByTripId(tripId: string) {
  const { data, error } = await supabaseAdmin
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true })
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function createExpense(input: any) {
  const validated = createExpenseSchema.safeParse(input)
  if (!validated.success) return { success: false, error: "Invalid input", issues: validated.error.issues }

  const { data, error } = await supabaseAdmin.from("expenses").insert(validated.data).select().single()
  if (error) return { success: false, error: error.message }
  revalidatePath("/trip-sheet")
  return { success: true, data }
}

export async function createMultipleExpenses(tripId: string, expenses: any[]) {
  const expensesToInsert = expenses.map(exp => ({
    ...exp,
    trip_id: tripId
  }))

  const { data, error } = await supabaseAdmin
    .from("expenses")
    .insert(expensesToInsert)
    .select()

  if (error) return { success: false, error: error.message }
  revalidatePath("/trip-sheet")
  return { success: true, data }
}

export async function updateExpense(input: any) {
  const validated = updateExpenseSchema.safeParse(input)
  if (!validated.success) return { success: false, error: "Invalid input" }

  const { id, ...updates } = validated.data
  const { data, error } = await supabaseAdmin.from("expenses").update(updates).eq("id", id).select().single()
  if (error) return { success: false, error: error.message }
  revalidatePath("/trip-sheet")
  return { success: true, data }
}

export async function deleteExpense(id: string) {
  const { error } = await supabaseAdmin.from("expenses").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidatePath("/trip-sheet")
  return { success: true }
}

export async function deleteExpensesByTripId(tripId: string) {
  const { error } = await supabaseAdmin.from("expenses").delete().eq("trip_id", tripId)
  if (error) return { success: false, error: error.message }
  revalidatePath("/trip-sheet")
  return { success: true }
}
