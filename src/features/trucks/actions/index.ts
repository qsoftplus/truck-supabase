"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/server"
import { createTruckSchema, updateTruckSchema, createMultipleTrucksSchema, type CreateTruck, type UpdateTruck, type CreateMultipleTrucks } from "../schema"

export async function getTrucks() {
  const { data, error } = await supabaseAdmin
    .from("trucks")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching trucks:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getTruckById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("trucks")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching truck:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createTruck(input: CreateTruck) {
  const validated = createTruckSchema.safeParse(input)
  
  if (!validated.success) {
    return { success: false, error: "Invalid input", issues: validated.error.issues }
  }

  const { data, error } = await supabaseAdmin
    .from("trucks")
    .insert(validated.data)
    .select()
    .single()

  if (error) {
    console.error("Error creating truck:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/trucks")
  revalidatePath("/setup")
  return { success: true, data }
}

export async function createMultipleTrucks(input: CreateMultipleTrucks) {
  const validated = createMultipleTrucksSchema.safeParse(input)
  
  if (!validated.success) {
    return { success: false, error: "Invalid input", issues: validated.error.issues }
  }

  const { data, error } = await supabaseAdmin
    .from("trucks")
    .insert(validated.data.trucks)
    .select()

  if (error) {
    console.error("Error creating trucks:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/trucks")
  revalidatePath("/setup")
  return { success: true, data }
}

export async function updateTruck(input: UpdateTruck) {
  const validated = updateTruckSchema.safeParse(input)
  
  if (!validated.success) {
    return { success: false, error: "Invalid input", issues: validated.error.issues }
  }

  const { id, ...updates } = validated.data

  const { data, error } = await supabaseAdmin
    .from("trucks")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating truck:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/trucks")
  revalidatePath("/setup")
  return { success: true, data }
}

export async function deleteTruck(id: string) {
  const { error } = await supabaseAdmin
    .from("trucks")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting truck:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/trucks")
  revalidatePath("/setup")
  return { success: true }
}
