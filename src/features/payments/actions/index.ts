"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/server"

// Get trips by truck ID for selection
export async function getTripsByTruck(truckId: string) {
  const { data, error } = await supabaseAdmin
    .from("trips")
    .select(`
      id,
      start_date,
      end_date,
      status,
      trucks (truck_no)
    `)
    .eq("truck_id", truckId)
    .order("start_date", { ascending: false })

  if (error) {
    console.error("Error fetching trips:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// Get loads by trip ID with courier details
export async function getLoadsByTrip(tripId: string) {
  const { data, error } = await supabaseAdmin
    .from("loads")
    .select(`
      *,
      courier_details (*)
    `)
    .eq("trip_id", tripId)
    .order("loading_date", { ascending: true })

  if (error) {
    console.error("Error fetching loads:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// Get pending payments (loads with balance > 0)
export async function getPendingPayments() {
  const { data, error } = await supabaseAdmin
    .from("loads")
    .select(`
      *,
      trips (
        start_date,
        end_date,
        trucks (truck_no),
        driver1:drivers!driver1_id (name)
      ),
      courier_details (*)
    `)
    .gt("balance_amount", 0)
    .order("loading_date", { ascending: false })

  if (error) {
    console.error("Error fetching pending payments:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// Update load payment details
export async function updateLoadPayment(input: {
  id: string
  pay_term: "To Pay" | "Advance"
  advance_amount: number
  balance_amount: number
}) {
  const { id, ...updates } = input
  const { data, error } = await supabaseAdmin
    .from("loads")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating load payment:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/payment-status")
  revalidatePath("/trip-sheet")
  return { success: true, data }
}

// Update payment status (record payment received)
export async function updatePaymentStatus(loadId: string, receivedAmount: number) {
  const { data: load, error: fetchError } = await supabaseAdmin
    .from("loads")
    .select("balance_amount, freight_amount, advance_amount")
    .eq("id", loadId)
    .single()
    
  if (fetchError || !load) {
    return { success: false, error: "Load not found" }
  }

  const newBalance = Math.max(0, Number(load.balance_amount) - receivedAmount)

  const { error } = await supabaseAdmin
    .from("loads")
    .update({ balance_amount: newBalance })
    .eq("id", loadId)

  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath("/payment-status")
  return { success: true, newBalance }
}

// --- COURIER DETAILS ---

// Get all courier details
export async function getCourierDetails() {
  const { data, error } = await supabaseAdmin
    .from("courier_details")
    .select(`
      *,
      loads (
        id,
        trip_id,
        from_location,
        to_location,
        freight_amount,
        pay_term,
        advance_amount,
        balance_amount,
        trips (
          trucks (truck_no),
          start_date
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching courier details:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// Get courier details by load ID
export async function getCourierDetailsByLoadId(loadId: string) {
  const { data, error } = await supabaseAdmin
    .from("courier_details")
    .select("*")
    .eq("load_id", loadId)
    .maybeSingle()

  if (error) {
    console.error("Error fetching courier details:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// Create courier details
export async function createCourierDetails(input: {
  load_id: string
  received_date?: string | null
  vendor?: string | null
  delivery_date?: string | null
}) {
  const { data, error } = await supabaseAdmin
    .from("courier_details")
    .insert(input)
    .select()
    .single()

  if (error) {
    console.error("Error creating courier details:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/payment-status")
  return { success: true, data }
}

// Update courier details
export async function updateCourierDetails(input: {
  id: string
  received_date?: string | null
  vendor?: string | null
  delivery_date?: string | null
}) {
  const { id, ...updates } = input
  const { data, error } = await supabaseAdmin
    .from("courier_details")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating courier details:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/payment-status")
  return { success: true, data }
}

// Delete courier details
export async function deleteCourierDetails(id: string) {
  const { error } = await supabaseAdmin
    .from("courier_details")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting courier details:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/payment-status")
  return { success: true }
}

// Upsert courier details (create if not exists, update if exists)
export async function upsertCourierDetails(input: {
  load_id: string
  received_date?: string | null
  vendor?: string | null
  delivery_date?: string | null
}) {
  // Check if courier details exist for this load
  const existing = await getCourierDetailsByLoadId(input.load_id)
  
  if (existing.success && existing.data) {
    // Update existing
    return updateCourierDetails({
      id: existing.data.id,
      received_date: input.received_date,
      vendor: input.vendor,
      delivery_date: input.delivery_date,
    })
  } else {
    // Create new
    return createCourierDetails(input)
  }
}

