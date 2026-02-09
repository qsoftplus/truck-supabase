"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Truck, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createMultipleTrucks, updateTruck, deleteTruck } from "../actions"
import { createMultipleTrucksSchema } from "../schema"

interface TrucksListProps {
  data: any[]
}

interface TruckInput {
  truck_no: string
  error?: string
}

export function TrucksList({ data }: TrucksListProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [trucks, setTrucks] = useState<TruckInput[]>([{ truck_no: "" }])
  const [editTruckNo, setEditTruckNo] = useState("")
  const [loading, setLoading] = useState(false)

  const addTruckInput = () => {
    setTrucks([...trucks, { truck_no: "" }])
  }

  const removeTruckInput = (index: number) => {
    if (trucks.length > 1) {
      setTrucks(trucks.filter((_, i) => i !== index))
    }
  }

  const updateTruckInput = (index: number, value: string) => {
    const newTrucks = [...trucks]
    newTrucks[index] = { truck_no: value, error: undefined }
    setTrucks(newTrucks)
  }

  const validateTrucks = (): boolean => {
    let isValid = true
    const newTrucks = trucks.map((truck) => {
      if (!truck.truck_no || truck.truck_no.trim().length === 0) {
        isValid = false
        return { ...truck, error: "Truck number is required" }
      }
      return { ...truck, error: undefined }
    })
    setTrucks(newTrucks)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingId) {
      // Edit mode - single truck update
      if (!editTruckNo.trim()) {
        toast.error("Truck number is required")
        return
      }
      setLoading(true)
      try {
        const result = await updateTruck({ id: editingId, truck_no: editTruckNo.trim() })
        if (result.success) {
          toast.success("Truck updated successfully!")
          setIsOpen(false)
          resetForm()
          router.refresh()
        } else {
          toast.error(result.error || "Failed to update truck")
        }
      } catch (error) {
        console.error("Error updating truck:", error)
        toast.error("An error occurred while updating the truck")
      } finally {
        setLoading(false)
      }
    } else {
      // Add mode - multi truck creation
      if (!validateTrucks()) {
        toast.error("Please fill in all truck numbers")
        return
      }
      
      setLoading(true)
      try {
        const validTrucks = trucks
          .filter(t => t.truck_no.trim().length > 0)
          .map(t => ({ truck_no: t.truck_no.trim() }))
        
        const validationResult = createMultipleTrucksSchema.safeParse({ trucks: validTrucks })
        
        if (!validationResult.success) {
          console.error("Validation error:", validationResult.error)
          toast.error("Validation failed. Please check your inputs.")
          setLoading(false)
          return
        }
        
        const result = await createMultipleTrucks({ trucks: validTrucks })
        if (result.success) {
          toast.success(`${validTrucks.length} truck${validTrucks.length > 1 ? 's' : ''} added successfully!`)
          setIsOpen(false)
          resetForm()
          router.refresh()
        } else {
          toast.error(result.error || "Failed to add trucks")
        }
      } catch (error) {
        console.error("Error creating trucks:", error)
        toast.error("An error occurred while adding trucks")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleEdit = (truck: any) => {
    setEditingId(truck.id)
    setEditTruckNo(truck.truck_no)
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this truck?")) {
      try {
        const result = await deleteTruck(id)
        if (result.success) {
          toast.success("Truck deleted successfully!")
          router.refresh()
        } else {
          toast.error(result.error || "Failed to delete truck")
        }
      } catch (error) {
        console.error("Error deleting truck:", error)
        toast.error("An error occurred while deleting the truck")
      }
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setTrucks([{ truck_no: "" }])
    setEditTruckNo("")
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Trucks Management</CardTitle>
          <CardDescription>Manage your fleet details</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Truck
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Truck" : "Add Trucks"}</DialogTitle>
              <DialogDescription>
                {editingId 
                  ? "Update the truck number below." 
                  : "Add one or more truck numbers. Click the + button to add more."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editingId ? (
                // Edit mode - single input
                <div className="grid gap-2">
                  <Label htmlFor="truck_no">Truck Number</Label>
                  <Input
                    id="truck_no"
                    placeholder="TN 00 AA 0000"
                    value={editTruckNo}
                    onChange={(e) => setEditTruckNo(e.target.value)}
                    required
                  />
                </div>
              ) : (
                // Add mode - multiple inputs
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Truck Numbers</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addTruckInput}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add More
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {trucks.map((truck, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder={`Truck Number ${index + 1}`}
                            value={truck.truck_no}
                            onChange={(e) => updateTruckInput(index, e.target.value)}
                            className={truck.error ? "border-red-500" : ""}
                          />
                          {truck.error && (
                            <p className="text-xs text-red-500 mt-1">{truck.error}</p>
                          )}
                        </div>
                        {trucks.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTruckInput(index)}
                            className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update Truck" : `Save ${trucks.length} Truck${trucks.length > 1 ? 's' : ''}`}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Truck className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No trucks added yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Truck Number</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((truck, index) => (
                <TableRow key={truck.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{truck.truck_no}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(truck)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(truck.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
