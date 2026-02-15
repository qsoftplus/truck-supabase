"use client"

import { useEffect, useState } from "react"
import { 
  Truck, 
  Wallet, 
  FileText, 
  AlertCircle, 
  DollarSign, 
  Plus
} from "lucide-react"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { getDashboardStats, getRecentTrips } from "@/features/dashboard/actions"
import { formatCurrencyCompact } from "@/lib/utils"

// Define interfaces matching the action return type
interface DashboardData {
  summary: {
    revenue: number
    expenses: number
    profit: number
    activeTrips: number
    pendingPayments: number
  }
  monthlyTrend: {
    month: string
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

interface RecentTrip {
  id: string
  start_date: string
  status: string
  trucks?: { truck_no: string } | null
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null)
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
          setData(statsRes.data as any) // Type assertion due to complex return type mapping
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

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-muted-foreground font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>

  const { summary, monthlyTrend, expenseDistribution } = data

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
           <Button variant="outline" onClick={() => window.location.reload()}>
             Refresh Data
           </Button>
           <Link href="/trip-sheet">
            <Button className="bg-indigo-600 hover:bg-indigo-700">New Trip</Button>
           </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" disabled>Analytics (Coming Soon)</TabsTrigger>
          <TabsTrigger value="reports" disabled>Reports (Coming Soon)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Top Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 truncate" title={`₹${summary.revenue.toLocaleString()}`}>
                  {formatCurrencyCompact(summary.revenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime revenue
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div 
                  className={`text-2xl font-bold truncate ${summary.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                  title={`₹${summary.profit.toLocaleString()}`}
                >
                  {formatCurrencyCompact(summary.profit)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Revenue - Expenses
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">{summary.activeTrips}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Vehicles currently on road
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 truncate" title={`₹${summary.pendingPayments.toLocaleString()}`}>
                  {formatCurrencyCompact(summary.pendingPayments)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  To be received from loads
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Main Trend Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>
                  Monthly revenue vs expenses for the past 6 months
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatCurrencyCompact(value)}
                      />
                      <Tooltip 
                        formatter={(value: number | undefined) => [`₹${(value || 0).toLocaleString()}`, '']}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown Pie Chart */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Expense Distribution</CardTitle>
                <CardDescription>
                  Breakdown by category (Lifetime)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number | undefined) => `₹${(value || 0).toLocaleString()}`} />
                      <Legend layout="vertical" align="right" verticalAlign="middle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Recent Trips */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
             <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Trips</CardTitle>
                <CardDescription>
                  Latest 5 trips and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTrips.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No trips found.</p>
                  ) : (
                    recentTrips.map((trip) => (
                      <div key={trip.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${trip.status === 'ongoing' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                            <Truck className={`h-4 w-4 ${trip.status === 'ongoing' ? 'text-indigo-600' : 'text-slate-600'}`} />
                          </div>
                          <div>
                            <p className="font-medium">{trip.trucks?.truck_no || "Unknown Truck"}</p>
                            <p className="text-sm text-muted-foreground">Started: {new Date(trip.start_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trip.status === 'ongoing' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {trip.status === 'ongoing' ? 'Active' : 'Completed'}
                          </div>
                          <Link href={`/trip-sheet?id=${trip.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
