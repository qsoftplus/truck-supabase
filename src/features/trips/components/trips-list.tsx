"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { 
  Plus, Pencil, Trash2, Eye, ChevronRight, ChevronDown, 
  MoreVertical, FileText, Package, DollarSign, Search, Filter,
  ChevronLeft
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { TripDetail } from "./trip-detail"
import { deleteTrip } from "../actions"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import React from "react"

interface TripsListProps {
  trips: any[]
  trucks: any[]
  drivers: any[]
}

export function TripsList({ trips, trucks, drivers }: TripsListProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [tripToDelete, setTripToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [truckFilter, setTruckFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter trips
  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      trip.driver1?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.driver2?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(trip.trip_no || "").toLowerCase().includes(searchQuery.toLowerCase())
    
    // Truck filter
    const matchesTruck = truckFilter === "all" || trip.truck_id === truckFilter

    // Determine status relative to current date logic
    const today = new Date().toISOString().split("T")[0]
    const tripStatus = trip.end_date && trip.end_date <= today ? "completed" : "ongoing"
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && tripStatus === "ongoing") ||
      (statusFilter === "completed" && tripStatus === "completed")

    return matchesSearch && matchesStatus && matchesTruck
  })

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, truckFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTrips = filteredTrips.slice(startIndex, startIndex + itemsPerPage)

  const toggleRow = (tripId: string) => {
    const newExpanded = new Set(expandedTrips)
    if (newExpanded.has(tripId)) {
      newExpanded.delete(tripId)
    } else {
      newExpanded.add(tripId)
    }
    setExpandedTrips(newExpanded)
  }

  const handleNewTrip = () => {
    setSelectedTrip(null)
    setIsOpen(true)
  }

  const handleViewTrip = (trip: any) => {
    setSelectedTrip(trip)
    setIsOpen(true)
  }

  const confirmDelete = (id: string) => {
    setTripToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    if (!tripToDelete) return
    setIsDeleting(true)
    
    // Optimistic update or just wait for refresh? 
    // Usually action returns success, then we refresh.
    // To avoid flicker, we can optimistically remove?
    // But pagination logic relies on props.
    // Just refresh.
    
    const result = await deleteTrip(tripToDelete)
    
    if (result.success) {
      toast.success("Trip deleted successfully!")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete trip")
    }
    
    setIsDeleting(false)
    setDeleteConfirmOpen(false)
    setTripToDelete(null)
  }

  const handleSuccess = () => {
    setIsOpen(false)
    setSelectedTrip(null)
    router.refresh()
  }

  // Calculate totals for a trip
  const calculateTripTotals = (trip: any) => {
    const totalFreight = trip.loads?.reduce((sum: number, load: any) => sum + (load.freight_amount || 0), 0) || 0
    const totalExpenses = trip.expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0
    return { totalFreight, totalExpenses, netProfit: totalFreight - totalExpenses }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Trip Sheets</CardTitle>
            <CardDescription>Manage your active and completed trips</CardDescription>
          </div>
          <Button onClick={handleNewTrip} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> New Trip
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by driver or truck number..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={truckFilter} onValueChange={setTruckFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by truck" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trucks</SelectItem>
                  {trucks.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.truck_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTrips.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No trips found matching your criteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>S.No</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Driver(s)</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Loads</TableHead>
                  <TableHead className="text-right">Freight</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrips.map((trip, index) => {
                  const globalIndex = startIndex + index
                  const { totalFreight, totalExpenses, netProfit } = calculateTripTotals(trip)
                  const isExpanded = expandedTrips.has(trip.id)
                  
                  // Re-calculate status for display consistency
                  const today = new Date().toISOString().split("T")[0]
                  const tripStatus = trip.end_date && trip.end_date <= today ? "completed" : "ongoing"
                  
                  return (
                    <React.Fragment key={trip.id}>
                      <TableRow className="cursor-pointer hover:bg-slate-50" onClick={() => toggleRow(trip.id)}>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{globalIndex + 1}</TableCell>
                        <TableCell className="font-medium">{trip.trucks?.truck_no}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{trip.driver1?.name}</span>
                            {trip.driver2 && <span className="text-muted-foreground text-xs">{trip.driver2.name}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(trip.start_date), "dd/MM/yyyy")}
                            {trip.end_date && (
                              <span className="text-muted-foreground"> - {format(new Date(trip.end_date), "dd/MM/yyyy")}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{trip.loads?.length || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          ₹{totalFreight.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          ₹{totalExpenses.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{netProfit.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={tripStatus === "ongoing" ? "default" : "secondary"}
                            className={tripStatus === "ongoing" ? "bg-green-100 text-green-800" : ""}
                          >
                            {tripStatus === "ongoing" ? "Active" : "Completed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewTrip(trip)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit / View
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => confirmDelete(trip.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableCell colSpan={11} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Loads Detail */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 font-semibold">
                                  <Package className="h-4 w-4" /> Loads / Singles
                                </div>
                                {trip.loads && trip.loads.length > 0 ? (
                                  <div className="border rounded-md bg-white">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="h-8">Date</TableHead>
                                          <TableHead className="h-8">From</TableHead>
                                          <TableHead className="h-8">To</TableHead>
                                          <TableHead className="h-8 text-right">Amount</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {trip.loads.map((load: any) => (
                                          <TableRow key={load.id} className="h-8">
                                            <TableCell className="py-2">{load.loading_date ? format(new Date(load.loading_date), "dd/MM") : "-"}</TableCell>
                                            <TableCell className="py-2">{load.from_location}</TableCell>
                                            <TableCell className="py-2">{load.to_location}</TableCell>
                                            <TableCell className="py-2 text-right">₹{load.freight_amount?.toLocaleString()}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No loads added.</p>
                                )}
                              </div>

                              {/* Expenses Detail */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 font-semibold">
                                  <DollarSign className="h-4 w-4" /> Expenses & Billing
                                </div>
                                {trip.expenses && trip.expenses.length > 0 ? (
                                  <div className="border rounded-md bg-white p-3 space-y-2">
                                    {trip.expenses.map((exp: any) => (
                                      <div key={exp.id} className="flex justify-between text-sm items-center border-b last:border-0 pb-1 last:pb-0">
                                        <span className="capitalize text-muted-foreground">
                                          {exp.category === 'other' || exp.category === 'billing' ? exp.note || exp.category : exp.category}
                                        </span>
                                        <span className="font-medium">₹{exp.amount?.toLocaleString()}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between font-bold pt-2 border-t mt-2">
                                      <span>Total Expenses</span>
                                      <span>₹{totalExpenses.toLocaleString()}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No expenses added.</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination Footer */}
          {filteredTrips.length > itemsPerPage && (
            <div className="flex items-center justify-between py-4 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTrips.length)} of {filteredTrips.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Trip Detail Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => { 
        setIsOpen(open)
        if (!open) setSelectedTrip(null)
      }}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTrip ? "Trip Details" : "Create New Trip"}</DialogTitle>
            <DialogDescription>
              {selectedTrip 
                ? "View and edit trip details, loads, and expenses" 
                : "Fill in the trip details, add loads/singles, and expenses"}
            </DialogDescription>
          </DialogHeader>
          <TripDetail 
            trip={selectedTrip} 
            trucks={trucks} 
            drivers={drivers} 
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirmed}
        title="Delete Trip?"
        description="Are you sure you want to delete this trip? All loads and expenses will also be deleted. This action cannot be undone."
        isDeleting={isDeleting}
      />
    </>
  )
}
