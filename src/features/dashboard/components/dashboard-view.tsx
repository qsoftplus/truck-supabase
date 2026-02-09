"use client"

import { useEffect, useState } from "react"
import { Truck, Wallet, FileText, AlertCircle, Plus } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getDashboardStats, getRecentTrips } from "@/features/dashboard/actions"

interface DashboardStats {
  revenue: number
  pending: number
  activeTrips: number
  expenses: number
}

interface RecentTrip {
  id: string
  start_date: string
  status: string
  trucks?: { truck_no: string } | null
}

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    pending: 0,
    activeTrips: 0,
    expenses: 0,
  })
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, tripsRes] = await Promise.all([
          getDashboardStats(),
          getRecentTrips(5),
        ])

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data)
        }

        if (tripsRes.success && tripsRes.data) {
          setRecentTrips(tripsRes.data as any)
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    {
      name: "Total Revenue",
      stat: `₹${stats.revenue.toLocaleString()}`,
      icon: Wallet,
      color: "bg-emerald-500",
    },
    {
      name: "Active Trips",
      stat: String(stats.activeTrips),
      icon: Truck,
      color: "bg-indigo-500",
    },
    {
      name: "Pending Payments",
      stat: `₹${stats.pending.toLocaleString()}`,
      icon: AlertCircle,
      color: "bg-amber-500",
    },
    {
      name: "Total Expenses",
      stat: `₹${stats.expenses.toLocaleString()}`,
      icon: FileText,
      color: "bg-red-500",
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h2>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <Card key={item.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.name}
              </CardTitle>
              <div className={`rounded-md p-2 ${item.color}`}>
                <item.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : item.stat}
              </div>
            </CardContent>
          </Card>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/trip-sheet">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-slate-50 transition-colors cursor-pointer">
                  <Plus className="h-8 w-8 text-indigo-600 mb-2" />
                  <span className="text-sm font-medium text-foreground">
                    New Trip Sheet
                  </span>
                </div>
              </Link>
              <Link href="/setup">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-slate-50 transition-colors cursor-pointer">
                  <Truck className="h-8 w-8 text-indigo-600 mb-2" />
                  <span className="text-sm font-medium text-foreground">
                    Add Truck
                  </span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
            <CardDescription>Latest trip activities</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTrips.length === 0 ? (
              <p className="text-slate-500 text-sm italic">
                No trips recorded yet.
              </p>
            ) : (
              <ul role="list" className="divide-y divide-slate-100">
                {recentTrips.map((trip) => (
                  <li key={trip.id} className="flex justify-between gap-x-6 py-4">
                    <div className="flex min-w-0 gap-x-4">
                      <div className="min-w-0 flex-auto">
                        <p className="text-sm font-semibold leading-6 text-foreground">
                          {trip.trucks?.truck_no || "Unknown Truck"}
                        </p>
                        <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">
                          Started {trip.start_date} • {trip.status}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end">
                      <p className="text-sm leading-6 text-foreground font-medium">
                        {trip.status === "ongoing" ? "Active" : "Completed"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
