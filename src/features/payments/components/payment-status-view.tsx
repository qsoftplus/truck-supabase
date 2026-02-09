"use client"

import { useEffect, useState, useTransition } from "react"
import { 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CreditCard,
  TrendingUp
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getPendingPayments, updatePaymentStatus } from "@/features/payments/actions"

interface PaymentLoad {
  id: string
  loading_date: string | null
  from_location: string | null
  to_location: string | null
  transporter: string | null
  freight_amount: number
  pay_term: string | null
  advance_amount: number
  balance_amount: number
  trips: {
    start_date: string
    trucks: { truck_no: string } | null
    driver1: { name: string } | null
  } | null
}

interface PaymentStats {
  totalPending: number
  totalPayments: number
  highPriority: number
  avgAmount: number
}

export function PaymentStatusView() {
  const [payments, setPayments] = useState<PaymentLoad[]>([])
  const [filteredPayments, setFilteredPayments] = useState<PaymentLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [stats, setStats] = useState<PaymentStats>({
    totalPending: 0,
    totalPayments: 0,
    highPriority: 0,
    avgAmount: 0,
  })

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("balance_amount")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Payment Dialog
  const [selectedPayment, setSelectedPayment] = useState<PaymentLoad | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch payments data
  useEffect(() => {
    async function fetchPayments() {
      try {
        const result = await getPendingPayments()
        if (result.success && result.data) {
          const paymentData = result.data as PaymentLoad[]
          setPayments(paymentData)
          setFilteredPayments(paymentData)

          // Calculate stats
          const totalPending = paymentData.reduce((sum, p) => sum + Number(p.balance_amount || 0), 0)
          const highPriority = paymentData.filter(p => Number(p.balance_amount) > 50000).length
          const avgAmount = paymentData.length > 0 ? totalPending / paymentData.length : 0

          setStats({
            totalPending,
            totalPayments: paymentData.length,
            highPriority,
            avgAmount,
          })
        }
      } catch (error) {
        console.error("Error fetching payments:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  // Filter and sort payments
  useEffect(() => {
    let result = [...payments]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.transporter?.toLowerCase().includes(query) ||
        p.from_location?.toLowerCase().includes(query) ||
        p.to_location?.toLowerCase().includes(query) ||
        p.trips?.trucks?.truck_no?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter === "high") {
      result = result.filter(p => Number(p.balance_amount) > 50000)
    } else if (statusFilter === "medium") {
      result = result.filter(p => Number(p.balance_amount) > 20000 && Number(p.balance_amount) <= 50000)
    } else if (statusFilter === "low") {
      result = result.filter(p => Number(p.balance_amount) <= 20000)
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0

      if (sortField === "balance_amount") {
        aVal = Number(a.balance_amount)
        bVal = Number(b.balance_amount)
      } else if (sortField === "loading_date") {
        aVal = a.loading_date || ""
        bVal = b.loading_date || ""
      } else if (sortField === "transporter") {
        aVal = a.transporter || ""
        bVal = b.transporter || ""
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    setFilteredPayments(result)
  }, [payments, searchQuery, statusFilter, sortField, sortDirection])

  // Handle payment recording
  const handleRecordPayment = () => {
    if (!selectedPayment || !paymentAmount) return

    startTransition(async () => {
      const result = await updatePaymentStatus(selectedPayment.id, Number(paymentAmount))
      
      if (result.success) {
        // Update local state
        setPayments(prev => prev.map(p => {
          if (p.id === selectedPayment.id) {
            return { ...p, balance_amount: result.newBalance ?? 0 }
          }
          return p
        }).filter(p => Number(p.balance_amount) > 0))

        // Recalculate stats
        const updatedPayments = payments.map(p => {
          if (p.id === selectedPayment.id) {
            return { ...p, balance_amount: result.newBalance ?? 0 }
          }
          return p
        }).filter(p => Number(p.balance_amount) > 0)

        const totalPending = updatedPayments.reduce((sum, p) => sum + Number(p.balance_amount || 0), 0)
        const highPriority = updatedPayments.filter(p => Number(p.balance_amount) > 50000).length
        const avgAmount = updatedPayments.length > 0 ? totalPending / updatedPayments.length : 0

        setStats({
          totalPending,
          totalPayments: updatedPayments.length,
          highPriority,
          avgAmount,
        })
      }

      setIsDialogOpen(false)
      setSelectedPayment(null)
      setPaymentAmount("")
    })
  }

  // Toggle sort
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Get priority badge
  const getPriorityBadge = (amount: number) => {
    if (amount > 50000) return <Badge variant="destructive">High</Badge>
    if (amount > 20000) return <Badge variant="warning">Medium</Badge>
    return <Badge variant="success">Low</Badge>
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const statCards = [
    {
      name: "Total Pending",
      value: formatCurrency(stats.totalPending),
      icon: IndianRupee,
      color: "bg-gradient-to-br from-amber-500 to-orange-600",
      iconBg: "bg-white/20",
    },
    {
      name: "Pending Payments",
      value: String(stats.totalPayments),
      icon: Clock,
      color: "bg-gradient-to-br from-blue-500 to-indigo-600",
      iconBg: "bg-white/20",
    },
    {
      name: "High Priority",
      value: String(stats.highPriority),
      icon: AlertTriangle,
      color: "bg-gradient-to-br from-red-500 to-rose-600",
      iconBg: "bg-white/20",
    },
    {
      name: "Average Amount",
      value: formatCurrency(stats.avgAmount),
      icon: TrendingUp,
      color: "bg-gradient-to-br from-emerald-500 to-teal-600",
      iconBg: "bg-white/20",
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Payment Status
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage pending payments from transporters
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <Card 
            key={item.name} 
            className={`${item.color} border-0 text-white overflow-hidden relative`}
          >
            <div className="absolute inset-0 bg-black/5" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">{item.name}</p>
                  <p className="text-2xl font-bold mt-1">
                    {loading ? "..." : item.value}
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${item.iconBg}`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Manage and track outstanding balances</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transporter, location..."
                  className="pl-10 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Priority Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">
                {payments.length === 0 ? "No Pending Payments" : "No Results Found"}
              </h3>
              <p className="text-muted-foreground mt-1">
                {payments.length === 0 
                  ? "All payments are up to date. Great job!" 
                  : "Try adjusting your search or filter criteria"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-semibold">Truck</TableHead>
                    <TableHead 
                      className="font-semibold cursor-pointer hover:text-primary"
                      onClick={() => toggleSort("transporter")}
                    >
                      <div className="flex items-center gap-1">
                        Transporter
                        {sortField === "transporter" && (
                          sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Route</TableHead>
                    <TableHead 
                      className="font-semibold cursor-pointer hover:text-primary"
                      onClick={() => toggleSort("loading_date")}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortField === "loading_date" && (
                          sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-right">Freight</TableHead>
                    <TableHead className="font-semibold text-right">Advance</TableHead>
                    <TableHead 
                      className="font-semibold text-right cursor-pointer hover:text-primary"
                      onClick={() => toggleSort("balance_amount")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Balance
                        {sortField === "balance_amount" && (
                          sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center">Priority</TableHead>
                    <TableHead className="font-semibold text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment, index) => (
                    <TableRow 
                      key={payment.id}
                      className={`
                        transition-colors
                        ${index % 2 === 0 ? "bg-white" : "bg-slate-50/30"}
                        hover:bg-slate-100/70
                      `}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-indigo-600">
                              {payment.trips?.trucks?.truck_no?.slice(-2) || "??"}
                            </span>
                          </div>
                          <span>{payment.trips?.trucks?.truck_no || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{payment.transporter || "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {payment.pay_term || "To Pay"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-muted-foreground">{payment.from_location || "—"}</span>
                          <span className="mx-1">→</span>
                          <span className="font-medium">{payment.to_location || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {payment.loading_date 
                            ? new Date(payment.loading_date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "2-digit"
                              })
                            : "—"
                          }
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(payment.freight_amount || 0))}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {formatCurrency(Number(payment.advance_amount || 0))}
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-600">
                        {formatCurrency(Number(payment.balance_amount || 0))}
                      </TableCell>
                      <TableCell className="text-center">
                        {getPriorityBadge(Number(payment.balance_amount || 0))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                          onClick={() => {
                            setSelectedPayment(payment)
                            setIsDialogOpen(true)
                          }}
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Pay
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary Footer */}
          {filteredPayments.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredPayments.length} of {payments.length} payments
              </span>
              <span className="font-medium text-foreground">
                Total: {formatCurrency(filteredPayments.reduce((sum, p) => sum + Number(p.balance_amount || 0), 0))}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Enter the payment amount received
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 py-4">
              {/* Payment Summary Card */}
              <div className="rounded-lg bg-slate-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Truck</span>
                  <span className="font-medium">{selectedPayment.trips?.trucks?.truck_no || "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transporter</span>
                  <span className="font-medium">{selectedPayment.transporter || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Route</span>
                  <span className="font-medium">
                    {selectedPayment.from_location} → {selectedPayment.to_location}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Freight Amount</span>
                    <span className="font-medium">{formatCurrency(Number(selectedPayment.freight_amount || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Advance Paid</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(Number(selectedPayment.advance_amount || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold mt-1">
                    <span className="text-amber-600">Balance Due</span>
                    <span className="text-amber-600">{formatCurrency(Number(selectedPayment.balance_amount || 0))}</span>
                  </div>
                </div>
              </div>

              {/* Payment Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Payment Amount (₹)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  placeholder="Enter amount received"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={Number(selectedPayment.balance_amount)}
                  className="text-lg"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(String(Math.round(Number(selectedPayment.balance_amount) / 2)))}
                  >
                    50%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(String(Number(selectedPayment.balance_amount)))}
                  >
                    Full Balance
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false)
                setSelectedPayment(null)
                setPaymentAmount("")
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRecordPayment}
              disabled={!paymentAmount || Number(paymentAmount) <= 0 || isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Record Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
