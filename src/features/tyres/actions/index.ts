"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/server"
import { createTyreSchema, updateTyreSchema, type CreateTyre, type UpdateTyre } from "../schema"

export async function getTyres(truckId?: string, startDate?: string, endDate?: string) {
  let query = supabaseAdmin
    .from("tyres")
    .select(`
      *,
      trucks (id, truck_no)
    `)
    .order("fitment_date", { ascending: false })

  // Handle truck filter (ignore if empty or "all")
  if (truckId && truckId !== "" && truckId !== "all") {
    query = query.eq("truck_id", truckId)
  }
  if (startDate) {
    query = query.gte("fitment_date", startDate)
  }
  if (endDate) {
    query = query.lte("fitment_date", endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching tyres:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createTyre(input: CreateTyre) {
  const validated = createTyreSchema.safeParse(input)
  
  if (!validated.success) {
    return { success: false, error: "Invalid input", issues: validated.error.issues }
  }

  const { data, error } = await supabaseAdmin
    .from("tyres")
    .insert(validated.data)
    .select()
    .single()

  if (error) {
    console.error("Error creating tyre:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/tyre-details")
  return { success: true, data }
}

export async function updateTyre(input: UpdateTyre) {
  const validated = updateTyreSchema.safeParse(input)
  
  if (!validated.success) {
    return { success: false, error: "Invalid input", issues: validated.error.issues }
  }

  const { id, ...updates } = validated.data

  const { data, error } = await supabaseAdmin
    .from("tyres")
    .update(updates)
    .select()
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error updating tyre:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/tyre-details")
  return { success: true, data }
}

export async function deleteTyre(id: string) {
  const { error } = await supabaseAdmin
    .from("tyres")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting tyre:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/tyre-details")
  return { success: true }
}
