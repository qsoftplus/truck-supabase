"use client"

import { useEffect, useState, useTransition, Fragment } from "react"
import { 
  CheckCircle2, 
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CreditCard,
  Package,
  ArrowRight,
  Printer,
  Edit,
  Trash2
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

import { getPendingPayments, updatePaymentStatus } from "@/features/payments/actions"
import { deleteLoad, getTripById, deleteTrip } from "@/features/trips/actions"
import { format } from "date-fns"
import { toast } from "sonner"

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
    id: string
    start_date: string
    end_date: string | null
    trucks: { truck_no: string } | null
    driver1: { name: string } | null
  } | null
  courier_details: any
}

interface GroupedTrip {
  tripId: string
  truckNo: string
  driver: string
  startDate: string
  endDate: string | null
  totalFreight: number
  totalBalance: number
  loadCount: number
  loads: PaymentLoad[]
}

interface PaymentStatusViewProps {
  trucks?: any[]
  drivers?: any[]
  onEditTrip?: (tripId: string) => void
}

export function PaymentStatusView({ trucks = [], drivers = [], onEditTrip }: PaymentStatusViewProps) {
  const [loading, setLoading] = useState(true)
  const [groupedTrips, setGroupedTrips] = useState<GroupedTrip[]>([])
  const [filteredTrips, setFilteredTrips] = useState<GroupedTrip[]>([])
  const [isPending, startTransition] = useTransition()

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [openTrips, setOpenTrips] = useState<string[]>([])

  // Payment Dialog
  const [selectedLoad, setSelectedLoad] = useState<PaymentLoad | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch payments data
  const fetchPayments = async () => {
    try {
      setLoading(true)
      const result = await getPendingPayments()
      if (result.success && result.data) {
        const paymentData = result.data as PaymentLoad[]
        
        // Group by trip
        const groups: {[key: string]: GroupedTrip} = {}
        
        paymentData.forEach(load => {
          const tripId = load.trips?.id || "unknown"
          
          if (!groups[tripId]) {
            groups[tripId] = {
              tripId,
              truckNo: load.trips?.trucks?.truck_no || "N/A",
              driver: load.trips?.driver1?.name || "N/A",
              startDate: load.trips?.start_date || "",
              endDate: load.trips?.end_date || null,
              totalFreight: 0,
              totalBalance: 0,
              loadCount: 0,
              loads: []
            }
          }
          
          groups[tripId].loads.push(load)
          groups[tripId].totalFreight += Number(load.freight_amount || 0)
          groups[tripId].totalBalance += Number(load.balance_amount || 0)
          groups[tripId].loadCount += 1
        })
        
        const tripsArray = Object.values(groups).sort((a, b) => {
          // First sort by truck number to group trips from the same truck
          if (a.truckNo !== b.truckNo) {
            return a.truckNo.localeCompare(b.truckNo)
          }
          // Then sort by start date (newest first) within the same truck
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        })
        
        setGroupedTrips(tripsArray)
        setFilteredTrips(tripsArray)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  // Filter trips
  useEffect(() => {
    let result = [...groupedTrips]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(trip => 
        trip.truckNo.toLowerCase().includes(query) ||
        trip.driver.toLowerCase().includes(query) ||
        trip.loads.some(l => 
          l.transporter?.toLowerCase().includes(query) || 
          l.from_location?.toLowerCase().includes(query) ||
          l.to_location?.toLowerCase().includes(query)
        )
      )
    }

    if (statusFilter === "high") {
      result = result.filter(trip => trip.totalBalance > 50000)
    } else if (statusFilter === "medium") {
      result = result.filter(trip => trip.totalBalance > 20000 && trip.totalBalance <= 50000)
    } else if (statusFilter === "low") {
      result = result.filter(trip => trip.totalBalance <= 20000)
    }

    setFilteredTrips(result)
  }, [groupedTrips, searchQuery, statusFilter])

  // Handle payment recording
  const handleRecordPayment = () => {
    if (!selectedLoad || !paymentAmount) return

    startTransition(async () => {
      const result = await updatePaymentStatus(selectedLoad.id, Number(paymentAmount))
      
      if (result.success) {
        // Refresh data manually or optimistically update
        // Optimistic update logic
        setGroupedTrips(prev => {
          const newTrips = prev.map(trip => {
            if (trip.tripId === selectedLoad.trips?.id) {
              const updatedLoads = trip.loads.map(l => {
                if (l.id === selectedLoad.id) {
                  return { ...l, balance_amount: result.newBalance ?? 0 }
                }
                return l
              }).filter(l => l.balance_amount > 0) // Remove if fully paid
              
              const newTotalBalance = updatedLoads.reduce((sum, l) => sum + Number(l.balance_amount), 0)
              const newTotalFreight = updatedLoads.reduce((sum, l) => sum + Number(l.freight_amount), 0)
              
              return {
                ...trip,
                loads: updatedLoads,
                totalBalance: newTotalBalance,
                totalFreight: newTotalFreight,
                loadCount: updatedLoads.length
              }
            }
            return trip
          }).filter(t => t.loadCount > 0) // Remove empty trips
          
          return newTrips
        })

        toast.success("Payment recorded successfully")
      } else {
        toast.error("Failed to record payment")
      }

      setIsDialogOpen(false)
      setSelectedLoad(null)
      setPaymentAmount("")
    })
  }

  const toggleTrip = (tripId: string) => {
    setOpenTrips(prev => 
      prev.includes(tripId) 
        ? prev.filter(id => id !== tripId)
        : [...prev, tripId]
    )
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Delete Dialog State
  const [deleteConfig, setDeleteConfig] = useState<{
    open: boolean
    type: "load" | "trip"
    id: string | null
  }>({
    open: false,
    type: "load",
    id: null
  })

  const confirmDeleteLoad = (loadId: string) => {
    setDeleteConfig({ open: true, type: "load", id: loadId })
  }

  const confirmDeleteTrip = (tripId: string) => {
    setDeleteConfig({ open: true, type: "trip", id: tripId })
  }

  const handleDeleteConfirmed = () => {
    const { type, id } = deleteConfig
    if (!id) return

    startTransition(async () => {
      if (type === "load") {
        const result = await deleteLoad(id)
        if (result.success) {
          setGroupedTrips(prev => {
            return prev.map(trip => {
              const updatedLoads = trip.loads.filter(l => l.id !== id)
              if (updatedLoads.length === 0) return null
              
              const newTotalBalance = updatedLoads.reduce((sum, l) => sum + Number(l.balance_amount || 0), 0)
              const newTotalFreight = updatedLoads.reduce((sum, l) => sum + Number(l.freight_amount || 0), 0)
              
              return {
                ...trip,
                loads: updatedLoads,
                totalBalance: newTotalBalance,
                totalFreight: newTotalFreight,
                loadCount: updatedLoads.length
              }
            }).filter(Boolean) as GroupedTrip[]
          })
          toast.success("Load deleted successfully")
        } else {
          toast.error(result.error || "Failed to delete load")
        }
      } else {
        const result = await deleteTrip(id)
        if (result.success) {
            setGroupedTrips(prev => prev.filter(t => t.tripId !== id))
            toast.success("Trip deleted successfully")
        } else {
            toast.error(result.error || "Failed to delete trip")
        }
      }
      setDeleteConfig(prev => ({ ...prev, open: false }))
    })
  }

  // Handle trip actions
  const handleEditTrip = async (tripId: string) => {
    if (tripId === "unknown" || !onEditTrip) return
    onEditTrip(tripId)
  }
  



  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Manage outstanding balances by trip</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search truck, driver..."
                  className="pl-10 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High Balance</SelectItem>
                  <SelectItem value="medium">Medium Balance</SelectItem>
                  <SelectItem value="low">Low Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
             </div>
          ) : filteredTrips.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">No pending payments found.</div>
          ) : (
            <div className="space-y-4">
              {filteredTrips.map((trip) => (
                <Collapsible
                  key={trip.tripId}
                  open={openTrips.includes(trip.tripId)}
                  onOpenChange={() => toggleTrip(trip.tripId)}
                  className="border rounded-lg bg-white overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => toggleTrip(trip.tripId)}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <CollapsibleTrigger asChild>
                           <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                             {openTrips.includes(trip.tripId) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                           </Button>
                        </CollapsibleTrigger>
                        <div>
                          <p className="font-semibold text-indigo-700">{trip.truckNo}</p>
                          <p className="text-xs text-muted-foreground">{trip.driver}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">
                            {format(new Date(trip.startDate), "dd MMM yyyy")}
                             {trip.endDate && ` - ${format(new Date(trip.endDate), "dd MMM")}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{trip.loadCount} Single(s)</p>
                      </div>

                      <div className="text-right md:text-left">
                        <p className="text-xs text-muted-foreground">Total Freight</p>
                        <p className="font-medium text-slate-700">{formatCurrency(trip.totalFreight)}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Balance Due</p>
                        <p className="font-bold text-amber-600 text-lg">{formatCurrency(trip.totalBalance)}</p>
                      </div>

                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={(e) => { e.stopPropagation(); handleEditTrip(trip.tripId) }}
                            title="Edit Payment Terms"
                        >
                            <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-red-50" 
                            onClick={(e) => { e.stopPropagation(); confirmDeleteTrip(trip.tripId) }}
                            title="Delete Trip"
                        >
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50">
                            <TableHead>Date</TableHead>
                            <TableHead>Route</TableHead>
                            <TableHead>Transporter</TableHead>
                            <TableHead className="text-right">Freight</TableHead>
                            <TableHead className="text-right">Advance</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trip.loads.map((load) => {
                             // Handle courier_details as array or object (Supabase 1:1 might return object)
                             let courier = null
                             if (Array.isArray(load.courier_details) && load.courier_details.length > 0) {
                               courier = load.courier_details[0]
                             } else if (load.courier_details && !Array.isArray(load.courier_details)) {
                               courier = load.courier_details
                             }

                             const hasCourierData = courier && (courier.received_date || courier.vendor || courier.delivery_date)

                             return (
                            <Fragment key={load.id}>
                              <TableRow className={hasCourierData ? "border-b-0" : ""}>
                                <TableCell>
                                  {load.loading_date ? format(new Date(load.loading_date), "dd/MM") : "-"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center text-sm gap-1">
                                    <span>{load.from_location?.split(" ")[0]}</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span>{load.to_location?.split(" ")[0]}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">{load.transporter}</TableCell>
                                <TableCell className="text-right">{formatCurrency(Number(load.freight_amount))}</TableCell>
                                <TableCell className="text-right text-emerald-600">{formatCurrency(Number(load.advance_amount))}</TableCell>
                                <TableCell className="text-right font-semibold text-amber-600">{formatCurrency(Number(load.balance_amount))}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 w-8 p-0"
                                      onClick={(e) => { e.stopPropagation(); setSelectedLoad(load); setIsDialogOpen(true); }}
                                      title="Quick Pay"
                                    >
                                      <CreditCard className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 w-8 p-0 hover:bg-red-50"
                                      onClick={(e) => { e.stopPropagation(); confirmDeleteLoad(load.id); }}
                                      title="Delete/Clear"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {hasCourierData && (
                                <TableRow className="bg-slate-50/40 hover:bg-slate-50/60">
                                  <TableCell colSpan={7} className="pt-2 pb-4 px-4">
                                    <div className="bg-indigo-50/50 rounded-md p-3 ml-6 border border-indigo-100">
                                       <div className="flex items-center gap-2 mb-2">
                                          <Package className="h-3 w-3 text-indigo-600" />
                                          <span className="font-semibold text-indigo-700 text-xs uppercase tracking-wider">Courier Details</span>
                                       </div>
                                       
                                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                          <div>
                                             <span className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">Received Courier Date</span>
                                             <span className="text-sm font-medium text-foreground">
                                                {courier?.received_date ? format(new Date(courier.received_date), "dd MMM yyyy") : "-"}
                                             </span>
                                          </div>
                                          
                                          <div>
                                             <span className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">Vendor</span>
                                             <span className="text-sm font-medium text-foreground">
                                                {courier?.vendor || "-"}
                                             </span>
                                          </div>
                                          
                                          <div>
                                             <span className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">Delivery Date</span>
                                             <span className="text-sm font-medium text-foreground">
                                                {courier?.delivery_date ? format(new Date(courier.delivery_date), "dd MMM yyyy") : "-"}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          )})}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter amount received for this load
            </DialogDescription>
          </DialogHeader>
          
          {selectedLoad && (
            <div className="space-y-4 py-4">
              <div className="rounded-md bg-slate-50 p-3 text-sm space-y-2">
                 <div className="flex justify-between">
                    <span>Route:</span>
                    <span className="font-medium">{selectedLoad.from_location} → {selectedLoad.to_location}</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Balance Due:</span>
                    <span className="font-bold text-amber-600">{formatCurrency(Number(selectedLoad.balance_amount))}</span>
                 </div>
              </div>

              <div className="space-y-2">
                <Label>Amount Received (₹)</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                />
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPaymentAmount(String(selectedLoad.balance_amount))}>
                        Full Amount
                    </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={isPending || !paymentAmount}>
                {isPending ? "Saving..." : "Save Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={deleteConfig.open}
        onOpenChange={(open) => setDeleteConfig(prev => ({ ...prev, open }))}
        onConfirm={handleDeleteConfirmed}
        title={deleteConfig.type === "trip" ? "Delete Trip?" : "Delete Load?"}
        description={
          deleteConfig.type === "trip" 
            ? "Are you sure you want to delete this trip and all its loads? This action cannot be undone." 
            : "Are you sure you want to delete this load? This action cannot be undone."
        }
        isDeleting={isPending}
      />
    </div>
  )
}
