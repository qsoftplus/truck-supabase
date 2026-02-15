"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { createDriver, updateDriver, deleteDriver } from "../actions"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { createDriverSchema, type CreateDriver } from "../schema"

interface DriversListProps {
  data: any[]
}

export function DriversList({ data }: DriversListProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<CreateDriver>>({
    name: "",
    phone: "",
    alt_phone: "",
    home_phone: "",
    license_no: "",
    aadhar_no: "",
    address: "",
  })
  const [errors, setErrors] = useState<{ name?: string }>({})
  const [loading, setLoading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {}
    
    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = "Driver name is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Please fill in the required fields")
      return
    }
    
    setLoading(true)

    try {
      const dataToSubmit = {
        name: formData.name!.trim(),
        phone: formData.phone?.trim() || null,
        alt_phone: formData.alt_phone?.trim() || null,
        home_phone: formData.home_phone?.trim() || null,
        license_no: formData.license_no?.trim() || null,
        aadhar_no: formData.aadhar_no?.trim() || null,
        address: formData.address?.trim() || null,
      }

      if (editingId) {
        const result = await updateDriver({ id: editingId, ...dataToSubmit })
        if (result.success) {
          toast.success("Driver updated successfully!")
          setIsOpen(false)
          resetForm()
          router.refresh()
        } else {
          toast.error(result.error || "Failed to update driver")
        }
      } else {
        const validationResult = createDriverSchema.safeParse(dataToSubmit)
        if (!validationResult.success) {
          console.error("Validation error:", validationResult.error)
          toast.error("Validation failed. Please check your inputs.")
          setLoading(false)
          return
        }
        const result = await createDriver(dataToSubmit as CreateDriver)
        if (result.success) {
          toast.success("Driver added successfully!")
          setIsOpen(false)
          resetForm()
          router.refresh()
        } else {
          toast.error(result.error || "Failed to add driver")
        }
      }
    } catch (error) {
      console.error("Error saving driver:", error)
      toast.error("An error occurred while saving the driver")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (driver: any) => {
    setEditingId(driver.id)
    setFormData({
      name: driver.name,
      phone: driver.phone || "",
      alt_phone: driver.alt_phone || "",
      home_phone: driver.home_phone || "",
      license_no: driver.license_no || "",
      aadhar_no: driver.aadhar_no || "",
      address: driver.address || "",
    })
    setErrors({})
    setIsOpen(true)
  }

  const confirmDelete = (id: string) => {
    setDriverToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    if (!driverToDelete) return
    setIsDeleting(true)
    try {
      const result = await deleteDriver(driverToDelete)
      if (result.success) {
        toast.success("Driver deleted successfully!")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to delete driver")
      }
    } catch (error) {
      console.error("Error deleting driver:", error)
      toast.error("An error occurred while deleting the driver")
    }
    setIsDeleting(false)
    setDeleteConfirmOpen(false)
    setDriverToDelete(null)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      name: "",
      phone: "",
      alt_phone: "",
      home_phone: "",
      license_no: "",
      aadhar_no: "",
      address: "",
    })
    setErrors({})
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Drivers Management</CardTitle>
          <CardDescription>Manage your drivers and their details</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Driver" : "Add New Driver"}</DialogTitle>
              <DialogDescription>
                Enter the driver details below. Only name is required.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Driver Name - Required */}
              <div className="grid gap-2">
                <Label htmlFor="name">Driver Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  placeholder="Enter driver name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) setErrors({})
                  }}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Primary phone"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="alt_phone">Alternative Phone</Label>
                  <Input
                    id="alt_phone"
                    placeholder="Alt phone"
                    value={formData.alt_phone || ""}
                    onChange={(e) => setFormData({ ...formData, alt_phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="home_phone">Home Phone</Label>
                  <Input
                    id="home_phone"
                    placeholder="Home phone"
                    value={formData.home_phone || ""}
                    onChange={(e) => setFormData({ ...formData, home_phone: e.target.value })}
                  />
                </div>
              </div>

              {/* License and Aadhar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="license_no">License Number</Label>
                  <Input
                    id="license_no"
                    placeholder="DL number"
                    value={formData.license_no || ""}
                    onChange={(e) => setFormData({ ...formData, license_no: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="aadhar_no">Aadhar Number</Label>
                  <Input
                    id="aadhar_no"
                    placeholder="12-digit Aadhar"
                    value={formData.aadhar_no || ""}
                    onChange={(e) => setFormData({ ...formData, aadhar_no: e.target.value })}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter full address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Driver"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No drivers added yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Aadhar</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((driver, index) => (
                <TableRow key={driver.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell>{driver.phone || "-"}</TableCell>
                  <TableCell>{driver.license_no || "-"}</TableCell>
                  <TableCell>{driver.aadhar_no || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(driver)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(driver.id)}
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
    <DeleteConfirmationDialog
      open={deleteConfirmOpen}
      onOpenChange={setDeleteConfirmOpen}
      onConfirm={handleDeleteConfirmed}
      title="Delete Driver?"
      description="Are you sure you want to delete this driver? This action cannot be undone."
      isDeleting={isDeleting}
    />
    </>
  )
}
