"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Truck, Calendar, DollarSign, Package, FileText, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getTripsByTruck, getLoadsByTrip, updateLoadPayment, upsertCourierDetails } from "../actions"
import { getTripById } from "@/features/trips/actions"

interface PaymentStatusFormProps {
  trucks: any[]
  initialTripId?: string | null
  onSuccess?: () => void
}

interface LoadWithPayment {
  id: string
  from_location: string
  to_location: string
  freight_amount: number
  pay_term: "To Pay" | "Advance"
  advance_amount: number
  balance_amount: number
  courier_details: any
}

export function PaymentStatusForm({ trucks, initialTripId, onSuccess }: PaymentStatusFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Selection state
  const [selectedTruckId, setSelectedTruckId] = useState("")
  const [trips, setTrips] = useState<any[]>([])
  const [selectedTripId, setSelectedTripId] = useState("")
  const [selectedTrip, setSelectedTrip] = useState<any>(null)
  
  // Loads state with payment details
  const [loads, setLoads] = useState<LoadWithPayment[]>([])
  
  // Courier details state (for Advance payments)
  const [courierForms, setCourierForms] = useState<{[loadId: string]: {
    received_date: string
    vendor: string
    delivery_date: string
  }}>({})

  // Handle initial trip ID (Pre-filling for Edit)
  useEffect(() => {
    async function loadInitialTrip() {
      if (initialTripId) {
        const result = await getTripById(initialTripId)
        if (result.success && result.data) {
          // Set truck first
          setSelectedTruckId(result.data.truck_id)
          // Set trip ID
          setSelectedTripId(initialTripId)
        }
      }
    }
    loadInitialTrip()
  }, [initialTripId])

  // Fetch trips when truck is selected
  useEffect(() => {
    if (selectedTruckId) {
      fetchTrips(selectedTruckId)
    } else {
      setTrips([])
      if (!initialTripId) setSelectedTripId("") // Only clear if not editing
      setLoads([])
    }
  }, [selectedTruckId])

  // Fetch loads when trip is selected
  useEffect(() => {
    if (selectedTripId) {
      fetchLoads(selectedTripId)
      // If trips are loaded, find the selected trip object
      if (trips.length > 0) {
        const trip = trips.find(t => t.id === selectedTripId)
        setSelectedTrip(trip)
      } else if (initialTripId === selectedTripId) {
          // If editing and trips not yet loaded, we might need to rely on the fetch calls in parallel
          // Ideally rely on the dependency array [selectedTripId, trips] to update this eventually
      }
    } else {
      setLoads([])
      setSelectedTrip(null)
    }
  }, [selectedTripId, trips])

  const fetchTrips = async (truckId: string) => {
    const result = await getTripsByTruck(truckId)
    if (result.success && result.data) {
      setTrips(result.data)
    } else {
      toast.error(result.error || "Failed to fetch trips")
    }
  }

  const fetchLoads = async (tripId: string) => {
    setLoading(true)
    const result = await getLoadsByTrip(tripId)
    if (result.success && result.data) {
      setLoads(result.data)
      // Initialize courier forms for each load
      const courierFormsInit: any = {}
      result.data.forEach((load: any) => {
        // Handle courier_details as array or object
        let courier = load.courier_details
        if (Array.isArray(courier)) {
          courier = courier.length > 0 ? courier[0] : {}
        } else if (!courier) {
          courier = {}
        }

        courierFormsInit[load.id] = {
          received_date: courier.received_date || "",
          vendor: courier.vendor || "",
          delivery_date: courier.delivery_date || "",
        }
      })
      setCourierForms(courierFormsInit)
    } else {
      toast.error(result.error || "Failed to fetch loads")
    }
    setLoading(false)
  }

  // Calculate total freight
  const totalFreight = useMemo(() => {
    return loads.reduce((sum, load) => sum + (load.freight_amount || 0), 0)
  }, [loads])

  // Handle pay term change
  const handlePayTermChange = async (loadId: string, payTerm: "To Pay" | "Advance") => {
    const load = loads.find(l => l.id === loadId)
    if (!load) return

    let advanceAmount = 0
    let balanceAmount = 0

    if (payTerm === "To Pay") {
      // To Pay: Full amount is advance (no balance)
      advanceAmount = load.freight_amount
      balanceAmount = 0
    } else {
      // Advance: Keep existing advance or set to 0, balance = freight - advance
      advanceAmount = load.advance_amount || 0
      balanceAmount = load.freight_amount - advanceAmount
    }

    // Update local state
    setLoads(prev => prev.map(l => 
      l.id === loadId 
        ? { ...l, pay_term: payTerm, advance_amount: advanceAmount, balance_amount: balanceAmount }
        : l
    ))
  }

  // Handle advance amount change (for Advance pay term)
  const handleAdvanceChange = (loadId: string, amount: number) => {
    const load = loads.find(l => l.id === loadId)
    if (!load) return

    const balanceAmount = Math.max(0, load.freight_amount - amount)
    
    setLoads(prev => prev.map(l => 
      l.id === loadId 
        ? { ...l, advance_amount: amount, balance_amount: balanceAmount }
        : l
    ))
  }

  // Handle courier form change
  const handleCourierChange = (loadId: string, field: string, value: string) => {
    setCourierForms(prev => ({
      ...prev,
      [loadId]: {
        ...prev[loadId],
        [field]: value
      }
    }))
  }

  // Save all changes
  const handleSave = async () => {
    setLoading(true)
    try {
      // Save each load's payment details
      for (const load of loads) {
        const result = await updateLoadPayment({
          id: load.id,
          pay_term: load.pay_term,
          advance_amount: load.advance_amount,
          balance_amount: load.balance_amount,
        })
        
        if (!result.success) {
          toast.error(`Failed to update load: ${result.error}`)
          continue
        }

        // If Advance, save courier details
        if (load.pay_term === "Advance" && courierForms[load.id]) {
          const courier = courierForms[load.id]
          if (courier.received_date || courier.vendor || courier.delivery_date) {
            await upsertCourierDetails({
              load_id: load.id,
              received_date: courier.received_date || null,
              vendor: courier.vendor || null,
              delivery_date: courier.delivery_date || null,
            })
          }
        }
      }

      toast.success("Payment details saved successfully!")
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error(error)
      toast.error("An error occurred while saving")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Selection Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-600" />
            <CardTitle>Select Trip</CardTitle>
          </div>
          <CardDescription>
            Choose a truck and trip to view and manage payment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Truck Selection */}
            <div className="space-y-2">
              <Label>Truck No</Label>
              <Select value={selectedTruckId} onValueChange={setSelectedTruckId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select truck" />
                </SelectTrigger>
                <SelectContent>
                  {trucks.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.truck_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date (Trip) Selection */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Select 
                value={selectedTripId} 
                onValueChange={setSelectedTripId}
                disabled={!selectedTruckId || trips.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={trips.length === 0 ? "No trips" : "Select trip"} />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {format(new Date(trip.start_date), "dd/MM/yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* End Date (Auto-filled) */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-slate-50 flex items-center">
                {selectedTrip?.end_date 
                  ? format(new Date(selectedTrip.end_date), "dd/MM/yyyy")
                  : selectedTrip ? "Ongoing" : "-"
                }
              </div>
            </div>

            {/* Total Freight */}
            <div className="space-y-2">
              <Label>Total Freight</Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-green-50 text-green-700 flex items-center font-medium">
                ₹{totalFreight.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loads Table */}
      {selectedTripId && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <CardTitle>Load Payment Details</CardTitle>
              <Badge variant="secondary">{loads.length} loads</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No loads found for this trip</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Freight</TableHead>
                    <TableHead>Pay Term</TableHead>
                    <TableHead className="text-right">Advance</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loads.map((load, index) => (
                    <TableRow key={load.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{load.from_location || "-"}</TableCell>
                      <TableCell>{load.to_location || "-"}</TableCell>
                      <TableCell className="text-right">
                        ₹{(load.freight_amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={load.pay_term || "To Pay"} 
                          onValueChange={(val) => handlePayTermChange(load.id, val as "To Pay" | "Advance")}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="To Pay">To Pay</SelectItem>
                            <SelectItem value="Advance">Advance</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        {load.pay_term === "Advance" ? (
                          <Input
                            type="number"
                            value={load.advance_amount || ""}
                            onChange={(e) => handleAdvanceChange(load.id, Number(e.target.value))}
                            className="w-28 text-right"
                            placeholder="0"
                          />
                        ) : (
                          <span className="font-medium">₹{(load.advance_amount || 0).toLocaleString()}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={load.balance_amount > 0 ? "text-red-600" : "text-green-600"}>
                          ₹{(load.balance_amount || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{(load.freight_amount || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Courier Details (only for Advance payments) */}
      {selectedTripId && loads.some(l => l.pay_term === "Advance") && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              <CardTitle>Courier Details</CardTitle>
            </div>
            <CardDescription>
              Track courier details for Advance payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Load (From → To)</TableHead>
                  <TableHead>Received Courier Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Delivery Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.filter(l => l.pay_term === "Advance").map((load, index) => (
                  <TableRow key={load.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <span className="font-medium">{load.from_location || "-"}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="font-medium">{load.to_location || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={courierForms[load.id]?.received_date || ""}
                        onChange={(e) => handleCourierChange(load.id, "received_date", e.target.value)}
                        className="w-40"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={courierForms[load.id]?.vendor || ""}
                        onChange={(e) => handleCourierChange(load.id, "vendor", e.target.value)}
                        placeholder="Vendor name"
                        className="w-40"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={courierForms[load.id]?.delivery_date || ""}
                        onChange={(e) => handleCourierChange(load.id, "delivery_date", e.target.value)}
                        className="w-40"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {selectedTripId && loads.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? "Saving..." : "Save Payment Details"}
          </Button>
        </div>
      )}
    </div>
  )
}
