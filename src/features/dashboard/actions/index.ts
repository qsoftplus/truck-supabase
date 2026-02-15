"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/server"

export interface DashboardData {
  summary: {
    revenue: number
    expenses: number
    profit: number
    activeTrips: number
    pendingPayments: number
  }
  monthlyTrend: {
    month: string // "Jan 2025"
    revenue: number
    expenses: number
    profit: number
  }[]
  expenseDistribution: {
    name: string
    value: number
    fill: string
  }[]
}

export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardData; error?: string }> {
  try {
    // 1. Fetch Revenue (Loads)
    const { data: loads, error: loadsError } = await supabaseAdmin
      .from("loads")
      .select("freight_amount, loading_date, balance_amount")

    if (loadsError) throw loadsError

    // 2. Fetch Trips (for Diesel & Active Status)
    const { data: trips, error: tripsError } = await supabaseAdmin
      .from("trips")
      .select("id, start_date, diesel_amount, status")
    
    if (tripsError) throw tripsError

    // 3. Fetch expenses (linked to trips)
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from("expenses")
      .select("amount, category, trips(start_date)")
    
    if (expensesError) throw expensesError

    // --- Aggregation Logic ---

    // A. Summary Stats
    const totalRevenue = loads.reduce((sum, l) => sum + (Number(l.freight_amount) || 0), 0)
    const totalPending = loads.reduce((sum, l) => sum + (Number(l.balance_amount) || 0), 0)
    const activeTripsCount = trips.filter(t => t.status === 'ongoing').length
    
    // Calculate total expenses (Diesel + Other Expenses)
    const totalDiesel = trips.reduce((sum, t) => sum + (Number(t.diesel_amount) || 0), 0)
    const totalOtherExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const totalExpenses = totalDiesel + totalOtherExpenses
    
    const totalProfit = totalRevenue - totalExpenses

    // B. Monthly Trend (Last 6-12 months)
    const monthlyMap = new Map<string, { revenue: number; expenses: number }>()

    // Helper to get month key "YYYY-MM"
    const getMonthKey = (dateStr?: string | null) => {
      if (!dateStr) return "Unknown"
      return dateStr.substring(0, 7) // "2023-01"
    }

    // Process Revenue
    loads.forEach(l => {
      const key = getMonthKey(l.loading_date)
      if (key === "Unknown") return
      const current = monthlyMap.get(key) || { revenue: 0, expenses: 0 }
      current.revenue += Number(l.freight_amount) || 0
      monthlyMap.set(key, current)
    })

    // Process Diesel Expenses (mapped to trip start date)
    trips.forEach(t => {
      const key = getMonthKey(t.start_date)
      if (key === "Unknown") return
      const current = monthlyMap.get(key) || { revenue: 0, expenses: 0 }
      current.expenses += Number(t.diesel_amount) || 0
      monthlyMap.set(key, current)
    })

    // Process Other Expenses (mapped to trip start date via join)
    expenses.forEach((e: any) => {
      const date = e.trips?.start_date
      const key = getMonthKey(date)
      if (key === "Unknown") return
      const current = monthlyMap.get(key) || { revenue: 0, expenses: 0 }
      current.expenses += Number(e.amount) || 0
      monthlyMap.set(key, current)
    })

    // Convert Map to Array and Sort
    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([key, val]) => {
        const [year, month] = key.split("-")
        const date = new Date(Number(year), Number(month) - 1)
        const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' })
        return {
          monthKey: key, // for sorting
          month: monthName,
          revenue: val.revenue,
          expenses: val.expenses,
          profit: val.revenue - val.expenses
        }
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6) // Last 6 months
      .map(({ month, revenue, expenses, profit }) => ({ month, revenue, expenses, profit }))

    // C. Expense Distribution
    const expenseCats = new Map<string, number>()
    
    // Add Diesel
    if (totalDiesel > 0) expenseCats.set("Diesel", totalDiesel)

    // Add Other Categories
    expenses.forEach((e: any) => {
      const cat = e.category || "Other"
      const current = expenseCats.get(cat) || 0
      expenseCats.set(cat, current + (Number(e.amount) || 0))
    })

    const expenseColors: Record<string, string> = {
      "Diesel": "#ef4444", // red-500
      "Salary": "#f59e0b", // amber-500
      "Toll": "#3b82f6",   // blue-500
      "Fastag": "#3b82f6", // blue-500
      "RTO": "#8b5cf6",    // violet-500
      "AdBlue": "#06b6d4", // cyan-500
      "Maintenance": "#10b981", // emerald-500
      "Other": "#64748b"   // slate-500
    }

    const expenseDistribution = Array.from(expenseCats.entries())
      .map(([name, value]) => ({
        name,
        value,
        fill: expenseColors[name] || expenseColors["Other"]
      }))
      .sort((a, b) => b.value - a.value)

    return {
      success: true,
      data: {
        summary: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: totalProfit,
          activeTrips: activeTripsCount,
          pendingPayments: totalPending
        },
        monthlyTrend,
        expenseDistribution
      }
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
