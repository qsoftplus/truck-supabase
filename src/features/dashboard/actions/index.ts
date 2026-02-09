"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function getDashboardStats() {
  try {
    // 1. Revenue & Pending (from Loads)
    const { data: loads } = await supabaseAdmin.from("loads").select("freight_amount, balance_amount")
    const revenue = ((loads || []) as any[]).reduce((sum, l) => sum + (Number(l.freight_amount) || 0), 0)
    const pending = ((loads || []) as any[]).reduce((sum, l) => sum + (Number(l.balance_amount) || 0), 0)

    // 2. Active Trips (from Trips)
    const { count: activeTripsCount } = await supabaseAdmin
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("status", "ongoing")

    // 3. Expenses (Diesel + Other Expenses)
    const { data: tripsDiesel } = await supabaseAdmin.from("trips").select("diesel_amount")
    const dieselTotal = ((tripsDiesel || []) as any[]).reduce((sum, t) => sum + (Number(t.diesel_amount) || 0), 0)

    const { data: otherExps } = await supabaseAdmin.from("expenses").select("amount")
    const otherTotal = ((otherExps || []) as any[]).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    const totalExp = dieselTotal + otherTotal

    return {
      success: true,
      data: {
        revenue,
        pending,
        activeTrips: activeTripsCount || 0,
        expenses: totalExp,
      },
    }
  } catch (error: any) {
    console.error("Dashboard stats error:", error)
    return { success: false, error: error.message }
  }
}

export async function getRecentTrips(limit = 5) {
  const { data, error } = await supabaseAdmin
    .from("trips")
    .select("*, trucks(truck_no)")
    .order("start_date", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching recent trips:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
