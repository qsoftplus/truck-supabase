"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/server"
import { createDriverSchema, updateDriverSchema, type CreateDriver, type UpdateDriver } from "../schema"

export async function getDrivers() {
  const { data, error } = await supabaseAdmin
    .from("drivers")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching drivers:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getDriverById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("drivers")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching driver:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createDriver(input: CreateDriver) {
  const validated = createDriverSchema.safeParse(input)
  
  if (!validated.success) {
    return { success: false, error: "Invalid input", issues: validated.error.issues }
  }

  const { data, error } = await supabaseAdmin
    .from("drivers")
    .insert(validated.data)
    .select()
    .single()

  if (error) {
    console.error("Error creating driver:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/drivers")
  revalidatePath("/setup")
  return { success: true, data }
}

export async function updateDriver(input: UpdateDriver) {
  const validated = updateDriverSchema.safeParse(input)
  
  if (!validated.success) {
    return { success: false, error: "Invalid input", issues: validated.error.issues }
  }

  const { id, ...updates } = validated.data

  const { data, error } = await supabaseAdmin
    .from("drivers")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating driver:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/drivers")
  revalidatePath("/setup")
  return { success: true, data }
}

export async function deleteDriver(id: string) {
  const { error } = await supabaseAdmin
    .from("drivers")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting driver:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/drivers")
  revalidatePath("/setup")
  return { success: true }
}
