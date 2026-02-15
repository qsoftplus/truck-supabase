"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Search, Trash2, Edit, Circle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { getTyres, createTyre, updateTyre, deleteTyre } from "@/features/tyres/actions"
import { getTrucks } from "@/features/trucks/actions"

interface TyreRecord {
  id: string
  truck_id: string
  make: string
  price: number
  fitment_date: string | null
  fitting_km: number
  removal_date: string | null
  removal_km: number
  remarks: string | null
  trucks?: { truck_no: string }
}

export function TyreDetailsView() {
  const [trucks, setTrucks] = useState<any[]>([])
  const [tyres, setTyres] = useState<TyreRecord[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filters
  const [filterTruckId, setFilterTruckId] = useState("")
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTyre, setEditingTyre] = useState<TyreRecord | null>(null)
  const [tyreForm, setTyreForm] = useState({
    truck_id: "",
    make: "",
    price: 0,
    fitment_date: "",
    fitting_km: 0,
    removal_date: "",
    removal_km: 0,
    remarks: "",
  })

  // Fetch trucks on mount
  useEffect(() => {
    fetchTrucks()
  }, [])

  // Fetch tyres when filter changes
  useEffect(() => {
    fetchTyres()
  }, [filterTruckId])

  const fetchTrucks = async () => {
    const result = await getTrucks()
    if (result.success && result.data) {
      setTrucks(result.data)
    }
  }

  const fetchTyres = async () => {
    setLoading(true)
    const result = await getTyres(filterTruckId, "", "")
    if (result.success && result.data) {
      setTyres(result.data)
    } else {
      toast.error(result.error || "Failed to fetch tyres")
    }
    setLoading(false)
  }

  // Calculate running KM and cost per KM
  const calculateStats = (tyre: TyreRecord) => {
    const runningKm = Math.max(0, (tyre.removal_km || 0) - (tyre.fitting_km || 0))
    const costPerKm = runningKm > 0 && tyre.price > 0 
      ? (runningKm / tyre.price).toFixed(2) 
      : "0.00"
    return { runningKm, costPerKm }
  }

  // Open dialog for new tyre
  const handleAddNew = () => {
    setEditingTyre(null)
    setTyreForm({
      truck_id: filterTruckId || "",
      make: "",
      price: 0,
      fitment_date: new Date().toISOString().split("T")[0],
      fitting_km: 0,
      removal_date: "",
      removal_km: 0,
      remarks: "",
    })
    setIsDialogOpen(true)
  }

  // Open dialog for editing
  const handleEdit = (tyre: TyreRecord) => {
    setEditingTyre(tyre)
    setTyreForm({
      truck_id: tyre.truck_id,
      make: tyre.make || "",
      price: tyre.price || 0,
      fitment_date: tyre.fitment_date || "",
      fitting_km: tyre.fitting_km || 0,
      removal_date: tyre.removal_date || "",
      removal_km: tyre.removal_km || 0,
      remarks: tyre.remarks || "",
    })
    setIsDialogOpen(true)
  }

  // Save tyre
  const handleSave = async () => {
    if (!tyreForm.truck_id) {
      toast.error("Please select a truck")
      return
    }
    if (!tyreForm.make) {
      toast.error("Please enter tyre make")
      return
    }

    setLoading(true)
    try {
      if (editingTyre) {
        const result = await updateTyre({
          id: editingTyre.id,
          ...tyreForm,
          removal_date: tyreForm.removal_date || null,
        })
        if (result.success) {
          toast.success("Tyre updated successfully!")
          fetchTyres()
        } else {
          toast.error(result.error || "Failed to update tyre")
        }
      } else {
        const result = await createTyre({
          ...tyreForm,
          removal_date: tyreForm.removal_date || null,
        })
        if (result.success) {
          toast.success("Tyre added successfully!")
          fetchTyres()
        } else {
          toast.error(result.error || "Failed to add tyre")
        }
      }
      setIsDialogOpen(false)
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Delete tyre
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tyre record?")) return
    
    const result = await deleteTyre(id)
    if (result.success) {
      toast.success("Tyre deleted successfully!")
      setTyres(tyres.filter(t => t.id !== id))
    } else {
      toast.error(result.error || "Failed to delete tyre")
    }
  }

  // Get truck name by ID
  const getTruckName = (truckId: string) => {
    const truck = trucks.find(t => t.id === truckId)
    return truck?.truck_no || "-"
  }

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Tyre Details
          </h1>
          <p className="text-muted-foreground mt-1">
            Track tyre fitment, removal, and calculate cost efficiency
          </p>
        </div>
        <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> Add Tyre
        </Button>
      </div>

      {/* Tyre Records Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Tyre Records</CardTitle>
              <CardDescription>
                {tyres.length} records found
                {filterTruckId && filterTruckId !== "all" && ` for ${getTruckName(filterTruckId)}`}
              </CardDescription>
            </div>
            <div className="w-[200px]">
              <Select value={filterTruckId} onValueChange={setFilterTruckId}>
                <SelectTrigger className="bg-slate-100">
                  <SelectValue placeholder="All Trucks" />
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
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : tyres.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tyre records found</p>
              <p className="text-sm">Add a new tyre record to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">S.No</TableHead>
                    <TableHead className="font-semibold">Truck No</TableHead>
                    <TableHead className="font-semibold">Tyre Make</TableHead>
                    <TableHead className="font-semibold text-right">Price (₹)</TableHead>
                    <TableHead className="font-semibold">Fitment Date</TableHead>
                    <TableHead className="font-semibold text-right">Fitting KM</TableHead>
                    <TableHead className="font-semibold">Removal Date</TableHead>
                    <TableHead className="font-semibold text-right">Removal KM</TableHead>
                    <TableHead className="font-semibold text-right">Running KM</TableHead>
                    <TableHead className="font-semibold text-right">Cost/KM (₹)</TableHead>
                    <TableHead className="font-semibold">Remarks</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tyres.map((tyre, index) => {
                    const { runningKm, costPerKm } = calculateStats(tyre)
                    return (
                      <TableRow key={tyre.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{tyre.trucks?.truck_no || getTruckName(tyre.truck_id)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{tyre.make || "-"}</TableCell>
                        <TableCell className="text-right">
                          ₹{(tyre.price || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{formatDate(tyre.fitment_date)}</TableCell>
                        <TableCell className="text-right">
                          {(tyre.fitting_km || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {tyre.removal_date ? (
                            formatDate(tyre.removal_date)
                          ) : (
                            <Badge variant="secondary" className="text-green-600">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {tyre.removal_km ? tyre.removal_km.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-blue-600">
                          {runningKm > 0 ? runningKm.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-amber-600">
                          {runningKm > 0 ? `₹${costPerKm}` : "-"}
                        </TableCell>
                        <TableCell className="max-w-32 truncate" title={tyre.remarks || ""}>
                          {tyre.remarks || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(tyre)}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(tyre.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTyre ? "Edit Tyre Record" : "Add New Tyre"}</DialogTitle>
            <DialogDescription>
              {editingTyre ? "Update tyre details and track performance" : "Add a new tyre record to track fitment and efficiency"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Truck Selection */}
            <div className="space-y-2">
              <Label>Truck No *</Label>
              <Select 
                value={tyreForm.truck_id} 
                onValueChange={(val) => setTyreForm({ ...tyreForm, truck_id: val })}
              >
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

            {/* Tyre Make */}
            <div className="space-y-2">
              <Label>Tyre Make *</Label>
              <Input
                value={tyreForm.make}
                onChange={(e) => setTyreForm({ ...tyreForm, make: e.target.value })}
                placeholder="e.g., MRF, Apollo, JK"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input
                type="number"
                value={tyreForm.price || ""}
                onChange={(e) => setTyreForm({ ...tyreForm, price: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            {/* Fitment Date */}
            <div className="space-y-2">
              <Label>Fitment Date</Label>
              <Input
                type="date"
                value={tyreForm.fitment_date}
                onChange={(e) => setTyreForm({ ...tyreForm, fitment_date: e.target.value })}
              />
            </div>

            {/* Fitting KM */}
            <div className="space-y-2">
              <Label>Fitting KM</Label>
              <Input
                type="number"
                value={tyreForm.fitting_km || ""}
                onChange={(e) => setTyreForm({ ...tyreForm, fitting_km: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            {/* Removal Date */}
            <div className="space-y-2">
              <Label>Removal Date</Label>
              <Input
                type="date"
                value={tyreForm.removal_date}
                onChange={(e) => setTyreForm({ ...tyreForm, removal_date: e.target.value })}
              />
            </div>

            {/* Removal KM */}
            <div className="space-y-2">
              <Label>Removal KM</Label>
              <Input
                type="number"
                value={tyreForm.removal_km || ""}
                onChange={(e) => setTyreForm({ ...tyreForm, removal_km: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            {/* Running KM (Calculated) */}
            <div className="space-y-2">
              <Label>Running KM (Auto)</Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-blue-50 text-blue-700 flex items-center font-medium">
                {Math.max(0, (tyreForm.removal_km || 0) - (tyreForm.fitting_km || 0)).toLocaleString()} km
              </div>
            </div>

            {/* Cost per KM (Calculated) */}
            <div className="space-y-2 col-span-2">
              <Label>Cost per KM (Auto)</Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-amber-50 text-amber-700 flex items-center font-medium">
                {(() => {
                  const runningKm = Math.max(0, (tyreForm.removal_km || 0) - (tyreForm.fitting_km || 0))
                  if (runningKm > 0 && tyreForm.price > 0) {
                    return `₹${(runningKm / tyreForm.price).toFixed(2)} per km`
                  }
                  return "— (Enter price and removal KM)"
                })()}
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-2 col-span-2">
              <Label>Remarks</Label>
              <Textarea
                value={tyreForm.remarks}
                onChange={(e) => setTyreForm({ ...tyreForm, remarks: e.target.value })}
                placeholder="Add any notes about this tyre..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? "Saving..." : editingTyre ? "Update Tyre" : "Add Tyre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
