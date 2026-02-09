"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Plus, Pencil, Trash2, Eye, ChevronRight } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { TripDetail } from "./trip-detail"
import { deleteTrip } from "../actions"

interface TripsListProps {
  trips: any[]
  trucks: any[]
  drivers: any[]
}

export function TripsList({ trips, trucks, drivers }: TripsListProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null)

  const handleNewTrip = () => {
    setSelectedTrip(null)
    setIsOpen(true)
  }

  const handleViewTrip = (trip: any) => {
    setSelectedTrip(trip)
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this trip? All loads and expenses will also be deleted.")) {
      const result = await deleteTrip(id)
      if (result.success) {
        toast.success("Trip deleted successfully!")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to delete trip")
      }
    }
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
          {trips.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No trips found. Create your first trip sheet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                {trips.map((trip, index) => {
                  const { totalFreight, totalExpenses, netProfit } = calculateTripTotals(trip)
                  return (
                    <TableRow key={trip.id} className="cursor-pointer hover:bg-slate-50" onClick={() => handleViewTrip(trip)}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
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
                          variant={trip.status === "ongoing" ? "default" : "secondary"}
                          className={trip.status === "ongoing" ? "bg-green-100 text-green-800" : ""}
                        >
                          {trip.status === "ongoing" ? "Active" : "Completed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewTrip(trip)
                            }}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(trip.id)
                            }}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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
    </>
  )
}
