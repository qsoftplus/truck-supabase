"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Plus, X, Trash2, Printer, Calculator, Truck,
  Users, Calendar, MapPin, FileText, DollarSign,
  Fuel, Percent, Package, CreditCard
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  createTrip, updateTrip,
  createLoad, updateLoad, deleteLoad,
  createExpense, deleteExpense, deleteExpensesByTripId, createMultipleExpenses,
  validateTripDates, validateLoadingDate
} from "../actions"
import { createDriver } from "@/features/drivers/actions"

// Expense categories
const EXPENSE_CATEGORIES = [
  { id: "diesel", label: "Diesel", hasLiters: true },
  { id: "adblue", label: "AdBlue (Oil)", hasLiters: true },
  { id: "salary", label: "Salary", hasPercentage: true },
  { id: "loading", label: "Loading" },
  { id: "unloading", label: "Unloading" },
  { id: "rto", label: "RTO & PC" },
  { id: "fastag", label: "Fastag" },
]

const generateId = () => Math.random().toString(36).substring(2, 9)

interface BillingItem {
  id: string
  title: string
  amount: number
}

interface TripDetailProps {
  trip?: any
  trucks: any[]
  drivers: any[]
  onSuccess?: () => void
}

export function TripDetail({ trip, trucks, drivers, onSuccess }: TripDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [driversList, setDriversList] = useState(drivers)

  // Trip header form state
  const [tripData, setTripData] = useState({
    id: trip?.id || null,
    truck_id: trip?.truck_id || "",
    driver1_id: trip?.driver1_id || "",
    driver2_id: trip?.driver2_id || null,
    start_date: trip?.start_date || new Date().toISOString().split("T")[0],
    end_date: trip?.end_date || "",
    start_km: trip?.start_km || 0,
    end_km: trip?.end_km || 0,
    diesel_liters: trip?.diesel_liters || 0,
    diesel_amount: trip?.diesel_amount || 0,
    status: trip?.status || "ongoing",
  })

  // Loads/Singles state
  const [loads, setLoads] = useState<any[]>(trip?.loads || [])
  const [isAddLoadOpen, setIsAddLoadOpen] = useState(false)
  const [editingLoad, setEditingLoad] = useState<any>(null)
  const [loadForm, setLoadForm] = useState({
    loading_date: "",
    from_location: "",
    to_location: "",
    transporter: "",
    freight_amount: 0,
    note: "",
    pay_term: "To Pay" as "To Pay" | "Advance",
    advance_amount: 0,
  })

  // Expenses state
  const [expenses, setExpenses] = useState<any[]>(trip?.expenses || [])
  const [expenseForm, setExpenseForm] = useState({
    diesel_liters: 0,
    diesel_amount: 0,
    adblue_liters: 0,
    adblue_amount: 0,
    salary_percentage: 0,
    salary_amount: 0,
    loading_amount: 0,
    unloading_amount: 0,
    rto_amount: 0,
    fastag_amount: 0,
  })

  // Billing items (multiple)
  const [billingItems, setBillingItems] = useState<BillingItem[]>([
    { id: generateId(), title: "", amount: 0 }
  ])

  // Other expenses (multiple)
  const [otherExpenses, setOtherExpenses] = useState<BillingItem[]>([
    { id: generateId(), title: "", amount: 0 }
  ])

  // Add driver dialog state
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false)
  const [newDriverName, setNewDriverName] = useState("")
  const [addingDriverFor, setAddingDriverFor] = useState<"driver1" | "driver2">("driver1")

  // Initialize expense form from existing expenses
  useEffect(() => {
    if (trip?.expenses && trip.expenses.length > 0) {
      const expenseMap: any = {}
      const billingList: BillingItem[] = []
      const otherList: BillingItem[] = []

      trip.expenses.forEach((exp: any) => {
        switch (exp.category) {
          case "diesel":
            expenseMap.diesel_liters = exp.liters || 0
            expenseMap.diesel_amount = exp.amount || 0
            break
          case "adblue":
            expenseMap.adblue_liters = exp.liters || 0
            expenseMap.adblue_amount = exp.amount || 0
            break
          case "salary":
            expenseMap.salary_percentage = exp.percentage || 0
            expenseMap.salary_amount = exp.amount || 0
            break
          case "loading":
            expenseMap.loading_amount = exp.amount || 0
            break
          case "unloading":
            expenseMap.unloading_amount = exp.amount || 0
            break
          case "rto":
            expenseMap.rto_amount = exp.amount || 0
            break
          case "fastag":
            expenseMap.fastag_amount = exp.amount || 0
            break
          case "billing":
            billingList.push({ id: exp.id, title: exp.title || "", amount: exp.amount || 0 })
            break
          case "other":
            otherList.push({ id: exp.id, title: exp.title || "", amount: exp.amount || 0 })
            break
        }
      })

      setExpenseForm(prev => ({ ...prev, ...expenseMap }))
      if (billingList.length > 0) setBillingItems(billingList)
      if (otherList.length > 0) setOtherExpenses(otherList)
    }
  }, [trip])

  // Calculate mileage
  const mileage = useMemo(() => {
    const distance = tripData.end_km - tripData.start_km
    if (distance <= 0 || tripData.diesel_liters <= 0) return 0
    return (distance / tripData.diesel_liters).toFixed(2)
  }, [tripData.start_km, tripData.end_km, tripData.diesel_liters])

  // Calculate total freight
  const totalFreight = useMemo(() => {
    return loads.reduce((sum, load) => sum + (load.freight_amount || 0), 0)
  }, [loads])

  // Calculate salary amount based on percentage
  const calculatedSalary = useMemo(() => {
    if (expenseForm.salary_percentage <= 0) return 0
    return Math.round(totalFreight / expenseForm.salary_percentage)
  }, [totalFreight, expenseForm.salary_percentage])

  // Calculate billing total
  const billingTotal = useMemo(() => {
    return billingItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  }, [billingItems])

  // Calculate other expenses total
  const otherExpensesTotal = useMemo(() => {
    return otherExpenses.reduce((sum, item) => sum + (item.amount || 0), 0)
  }, [otherExpenses])

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return (
      expenseForm.diesel_amount +
      expenseForm.adblue_amount +
      calculatedSalary +
      expenseForm.loading_amount +
      expenseForm.unloading_amount +
      expenseForm.rto_amount +
      expenseForm.fastag_amount +
      billingTotal +
      otherExpensesTotal
    )
  }, [expenseForm, calculatedSalary, billingTotal, otherExpensesTotal])

  // Calculate net profit
  const netProfit = useMemo(() => {
    return totalFreight - totalExpenses
  }, [totalFreight, totalExpenses])

  // Handle trip field change
  const handleTripChange = (field: string, value: any) => {
    setTripData(prev => ({ ...prev, [field]: value }))
  }

  // Handle adding a new driver
  const handleAddDriver = async () => {
    if (!newDriverName.trim()) {
      toast.error("Please enter driver name")
      return
    }

    const result = await createDriver({ name: newDriverName.trim() })
    if (result.success && result.data) {
      toast.success("Driver added successfully!")
      setDriversList(prev => [...prev, result.data])
      handleTripChange(addingDriverFor === "driver1" ? "driver1_id" : "driver2_id", result.data.id)
      setNewDriverName("")
      setIsAddDriverOpen(false)
    } else {
      toast.error(result.error || "Failed to add driver")
    }
  }

  // Open add driver dialog
  const openAddDriverDialog = (forDriver: "driver1" | "driver2") => {
    setAddingDriverFor(forDriver)
    setNewDriverName("")
    setIsAddDriverOpen(true)
  }

  // Handle load form submission
  const handleSaveLoad = async () => {
    if (!tripData.id) {
      toast.error("Please save the trip first before adding loads")
      return
    }

    // Validate loading date
    if (loadForm.loading_date) {
      const validation = await validateLoadingDate(tripData.id, loadForm.loading_date)
      if (!validation.valid) {
        toast.error(validation.error)
        return
      }
    }

    setLoading(true)
    try {
      if (editingLoad) {
        const result = await updateLoad({
          id: editingLoad.id,
          ...loadForm,
        })
        if (result.success) {
          setLoads(prev => prev.map(l => l.id === editingLoad.id ? result.data : l))
          toast.success("Load updated successfully!")
        } else {
          toast.error(result.error || "Failed to update load")
        }
      } else {
        const result = await createLoad({
          trip_id: tripData.id,
          ...loadForm,
        })
        if (result.success) {
          setLoads(prev => [...prev, result.data])
          toast.success("Load added successfully!")
        } else {
          toast.error(result.error || "Failed to add load")
        }
      }

      setIsAddLoadOpen(false)
      setEditingLoad(null)
      setLoadForm({
        loading_date: "",
        from_location: "",
        to_location: "",
        transporter: "",
        freight_amount: 0,
        note: "",
        pay_term: "To Pay",
        advance_amount: 0,
      })
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Handle delete load
  const handleDeleteLoad = async (loadId: string) => {
    if (!confirm("Are you sure you want to delete this load?")) return

    const result = await deleteLoad(loadId)
    if (result.success) {
      setLoads(prev => prev.filter(l => l.id !== loadId))
      toast.success("Load deleted successfully!")
    } else {
      toast.error(result.error || "Failed to delete load")
    }
  }

  // Handle edit load
  const handleEditLoad = (load: any) => {
    setEditingLoad(load)
    setLoadForm({
      loading_date: load.loading_date || "",
      from_location: load.from_location || "",
      to_location: load.to_location || "",
      transporter: load.transporter || "",
      freight_amount: load.freight_amount || 0,
      note: load.note || "",
      pay_term: load.pay_term || "To Pay",
      advance_amount: load.advance_amount || 0,
    })
    setIsAddLoadOpen(true)
  }

  // Add billing item
  const addBillingItem = () => {
    setBillingItems(prev => [...prev, { id: generateId(), title: "", amount: 0 }])
  }

  // Remove billing item
  const removeBillingItem = (id: string) => {
    if (billingItems.length > 1) {
      setBillingItems(prev => prev.filter(item => item.id !== id))
    }
  }

  // Update billing item
  const updateBillingItem = (id: string, field: "title" | "amount", value: any) => {
    setBillingItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: field === "amount" ? Number(value) : value } : item
    ))
  }

  // Add other expense
  const addOtherExpense = () => {
    setOtherExpenses(prev => [...prev, { id: generateId(), title: "", amount: 0 }])
  }

  // Remove other expense
  const removeOtherExpense = (id: string) => {
    if (otherExpenses.length > 1) {
      setOtherExpenses(prev => prev.filter(item => item.id !== id))
    }
  }

  // Update other expense
  const updateOtherExpense = (id: string, field: "title" | "amount", value: any) => {
    setOtherExpenses(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: field === "amount" ? Number(value) : value } : item
    ))
  }

  // Save entire trip with all data
  const handleSaveTrip = async () => {
    // Validate required fields
    if (!tripData.truck_id) {
      toast.error("Please select a truck")
      return
    }
    if (!tripData.driver1_id) {
      toast.error("Please select a primary driver")
      return
    }
    if (!tripData.start_date) {
      toast.error("Please select a start date")
      return
    }

    // Validate dates
    const dateValidation = await validateTripDates(
      tripData.truck_id,
      tripData.start_date,
      tripData.end_date || null,
      tripData.id || undefined
    )

    if (!dateValidation.valid) {
      toast.error(dateValidation.error)
      return
    }

    setLoading(true)
    try {
      let savedTripId = tripData.id

      // Create or update trip
      const tripPayload = {
        truck_id: tripData.truck_id,
        driver1_id: tripData.driver1_id,
        driver2_id: tripData.driver2_id || null,
        start_date: tripData.start_date,
        end_date: tripData.end_date || null,
        start_km: tripData.start_km,
        end_km: tripData.end_km || null,
        diesel_liters: tripData.diesel_liters,
        diesel_amount: expenseForm.diesel_amount,
        status: tripData.status,
      }

      if (tripData.id) {
        const result = await updateTrip({ id: tripData.id, ...tripPayload })
        if (!result.success) {
          toast.error(result.error || "Failed to update trip")
          setLoading(false)
          return
        }
      } else {
        const result = await createTrip(tripPayload)
        if (!result.success) {
          toast.error(result.error || "Failed to create trip")
          setLoading(false)
          return
        }
        savedTripId = result.data.id
        setTripData(prev => ({ ...prev, id: savedTripId }))
      }

      // Save expenses
      if (savedTripId) {
        // Delete existing expenses and recreate
        await deleteExpensesByTripId(savedTripId)

        const expensesToCreate = []

        // Diesel
        if (expenseForm.diesel_amount > 0 || expenseForm.diesel_liters > 0) {
          expensesToCreate.push({
            category: "diesel",
            liters: expenseForm.diesel_liters,
            amount: expenseForm.diesel_amount,
          })
        }

        // AdBlue
        if (expenseForm.adblue_amount > 0 || expenseForm.adblue_liters > 0) {
          expensesToCreate.push({
            category: "adblue",
            liters: expenseForm.adblue_liters,
            amount: expenseForm.adblue_amount,
          })
        }

        // Salary
        if (calculatedSalary > 0) {
          expensesToCreate.push({
            category: "salary",
            percentage: expenseForm.salary_percentage,
            amount: calculatedSalary,
          })
        }

        // Loading
        if (expenseForm.loading_amount > 0) {
          expensesToCreate.push({
            category: "loading",
            amount: expenseForm.loading_amount,
          })
        }

        // Unloading
        if (expenseForm.unloading_amount > 0) {
          expensesToCreate.push({
            category: "unloading",
            amount: expenseForm.unloading_amount,
          })
        }

        // RTO
        if (expenseForm.rto_amount > 0) {
          expensesToCreate.push({
            category: "rto",
            amount: expenseForm.rto_amount,
          })
        }

        // Fastag
        if (expenseForm.fastag_amount > 0) {
          expensesToCreate.push({
            category: "fastag",
            amount: expenseForm.fastag_amount,
          })
        }

        // Billing items
        billingItems.forEach(item => {
          if (item.title && item.amount > 0) {
            expensesToCreate.push({
              category: "billing",
              title: item.title,
              amount: item.amount,
            })
          }
        })

        // Other expenses
        otherExpenses.forEach(item => {
          if (item.title && item.amount > 0) {
            expensesToCreate.push({
              category: "other",
              title: item.title,
              amount: item.amount,
            })
          }
        })

        if (expensesToCreate.length > 0) {
          await createMultipleExpenses(savedTripId, expensesToCreate)
        }
      }

      toast.success(tripData.id ? "Trip updated successfully!" : "Trip created successfully!")
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error(error)
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Print trip as PDF
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 space-y-4">
      {/* Trip Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-600" />
              <CardTitle>Trip Details</CardTitle>
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Print PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Truck and Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Truck No *</Label>
              <Select
                value={tripData.truck_id}
                onValueChange={(val) => handleTripChange("truck_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select truck" />
                </SelectTrigger>
                <SelectContent>
                  {trucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.truck_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={tripData.start_date}
                onChange={(e) => handleTripChange("start_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={tripData.end_date}
                onChange={(e) => handleTripChange("end_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={tripData.status}
                onValueChange={(val) => handleTripChange("status", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Drivers Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Driver 1 *
              </Label>
              <div className="flex gap-2">
                <Select
                  value={tripData.driver1_id}
                  onValueChange={(val) => handleTripChange("driver1_id", val)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {driversList.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openAddDriverDialog("driver1")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Driver 2
              </Label>
              <div className="flex gap-2">
                <Select
                  value={tripData.driver2_id || "none"}
                  onValueChange={(val) => handleTripChange("driver2_id", val === "none" ? null : val)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {driversList.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openAddDriverDialog("driver2")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* KM and Mileage Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Starting KM (A)</Label>
              <Input
                type="number"
                value={tripData.start_km || ""}
                onChange={(e) => handleTripChange("start_km", Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Ending KM (B)</Label>
              <Input
                type="number"
                value={tripData.end_km || ""}
                onChange={(e) => handleTripChange("end_km", Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Diesel Liters (C)</Label>
              <Input
                type="number"
                value={tripData.diesel_liters || ""}
                onChange={(e) => handleTripChange("diesel_liters", Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calculator className="h-4 w-4" /> Mileage (B-A)/C
              </Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-slate-50 flex items-center font-medium">
                {mileage} km/L
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loads/Singles Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <CardTitle>Loads / Singles</CardTitle>
              <Badge variant="secondary">{loads.length} singles</Badge>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setEditingLoad(null)
                setLoadForm({
                  loading_date: "",
                  from_location: "",
                  to_location: "",
                  transporter: "",
                  freight_amount: 0,
                  note: "",
                  pay_term: "To Pay",
                  advance_amount: 0,
                })
                setIsAddLoadOpen(true)
              }}
              className="no-print"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Load
            </Button>
          </div>
          <CardDescription>
            Each load/single represents one loading point within this trip
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No loads added yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loading Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Transporter</TableHead>
                  <TableHead className="text-right">Freight</TableHead>
                  <TableHead className="no-print text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.map((load) => (
                  <TableRow key={load.id}>
                    <TableCell>
                      {load.loading_date ? format(new Date(load.loading_date), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell>{load.from_location || "-"}</TableCell>
                    <TableCell>{load.to_location || "-"}</TableCell>
                    <TableCell>{load.transporter || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{(load.freight_amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right no-print">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditLoad(load)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeleteLoad(load.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-50 font-semibold">
                  <TableCell colSpan={4}>Total Freight</TableCell>
                  <TableCell className="text-right">₹{totalFreight.toLocaleString()}</TableCell>
                  <TableCell className="no-print"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-red-600" />
            <CardTitle>Expenses</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Diesel & AdBlue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center gap-2 font-medium">
                <Fuel className="h-4 w-4" /> Diesel
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Liters</Label>
                  <Input
                    type="number"
                    value={expenseForm.diesel_liters || ""}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, diesel_liters: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount (₹)</Label>
                  <Input
                    type="number"
                    value={expenseForm.diesel_amount || ""}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, diesel_amount: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center gap-2 font-medium">
                <Fuel className="h-4 w-4" /> AdBlue (Oil)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Liters</Label>
                  <Input
                    type="number"
                    value={expenseForm.adblue_liters || ""}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, adblue_liters: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount (₹)</Label>
                  <Input
                    type="number"
                    value={expenseForm.adblue_amount || ""}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, adblue_amount: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Salary */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center gap-2 font-medium">
              <Percent className="h-4 w-4" /> Salary
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Percentage (e.g., 14, 15, 16)</Label>
                <Input
                  type="number"
                  value={expenseForm.salary_percentage || ""}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, salary_percentage: Number(e.target.value) }))}
                  placeholder="16"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total Freight</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-slate-50 flex items-center">
                  ₹{totalFreight.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Calculated Amount (Freight ÷ %)</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-green-50 text-green-700 flex items-center font-medium">
                  ₹{calculatedSalary.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Loading, Unloading, RTO, Fastag */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Loading (₹)</Label>
              <Input
                type="number"
                value={expenseForm.loading_amount || ""}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, loading_amount: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Unloading (₹)</Label>
              <Input
                type="number"
                value={expenseForm.unloading_amount || ""}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, unloading_amount: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>RTO & PC (₹)</Label>
              <Input
                type="number"
                value={expenseForm.rto_amount || ""}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, rto_amount: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Fastag (₹)</Label>
              <Input
                type="number"
                value={expenseForm.fastag_amount || ""}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, fastag_amount: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Billing - Multiple */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <CreditCard className="h-4 w-4" /> Billing
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={addBillingItem} className="no-print">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {billingItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Title"
                    value={item.title}
                    onChange={(e) => updateBillingItem(item.id, "title", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={item.amount || ""}
                    onChange={(e) => updateBillingItem(item.id, "amount", e.target.value)}
                    className="w-32"
                  />
                  {billingItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBillingItem(item.id)}
                      className="text-red-500 no-print"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t">
              <span className="font-medium">Billing Total: ₹{billingTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Other Expenses - Multiple */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4" /> Other Expenses
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={addOtherExpense} className="no-print">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {otherExpenses.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Title"
                    value={item.title}
                    onChange={(e) => updateOtherExpense(item.id, "title", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={item.amount || ""}
                    onChange={(e) => updateOtherExpense(item.id, "amount", e.target.value)}
                    className="w-32"
                  />
                  {otherExpenses.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOtherExpense(item.id)}
                      className="text-red-500 no-print"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t">
              <span className="font-medium">Other Total: ₹{otherExpensesTotal.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-indigo-800">Trip Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Total Income</div>
              <div className="text-2xl font-bold text-green-600">
                ₹{totalFreight.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Total Expenses</div>
              <div className="text-2xl font-bold text-red-600">
                ₹{totalExpenses.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Net Profit</div>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{netProfit.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4 no-print">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveTrip}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? "Saving..." : tripData.id ? "Update Trip" : "Create Trip"}
        </Button>
      </div>

      {/* Add Load Dialog */}
      <Dialog open={isAddLoadOpen} onOpenChange={setIsAddLoadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLoad ? "Edit Load" : "Add New Load"}</DialogTitle>
            <DialogDescription>
              Enter the load/single details. Loading date must be between trip start and end dates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loading Date</Label>
                <Input
                  type="date"
                  value={loadForm.loading_date}
                  onChange={(e) => setLoadForm(prev => ({ ...prev, loading_date: e.target.value }))}
                  min={tripData.start_date}
                  max={tripData.end_date || undefined}
                />
              </div>
              <div className="space-y-2">
                <Label>Transporter</Label>
                <Input
                  value={loadForm.transporter}
                  onChange={(e) => setLoadForm(prev => ({ ...prev, transporter: e.target.value }))}
                  placeholder="Transporter name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Location</Label>
                <Input
                  value={loadForm.from_location}
                  onChange={(e) => setLoadForm(prev => ({ ...prev, from_location: e.target.value }))}
                  placeholder="Loading point"
                />
              </div>
              <div className="space-y-2">
                <Label>To Location</Label>
                <Input
                  value={loadForm.to_location}
                  onChange={(e) => setLoadForm(prev => ({ ...prev, to_location: e.target.value }))}
                  placeholder="Unloading point"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Freight Amount (₹)</Label>
                <Input
                  type="number"
                  value={loadForm.freight_amount || ""}
                  onChange={(e) => setLoadForm(prev => ({ ...prev, freight_amount: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Pay Term</Label>
                <Select
                  value={loadForm.pay_term}
                  onValueChange={(val: "To Pay" | "Advance") => setLoadForm(prev => ({ ...prev, pay_term: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Pay">To Pay</SelectItem>
                    <SelectItem value="Advance">Advance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadForm.pay_term === "Advance" && (
              <div className="space-y-2">
                <Label>Advance Amount (₹)</Label>
                <Input
                  type="number"
                  value={loadForm.advance_amount || ""}
                  onChange={(e) => setLoadForm(prev => ({ ...prev, advance_amount: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={loadForm.note}
                onChange={(e) => setLoadForm(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLoadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLoad} disabled={loading}>
              {loading ? "Saving..." : editingLoad ? "Update" : "Add Load"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Driver Dialog */}
      <Dialog open={isAddDriverOpen} onOpenChange={setIsAddDriverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>
              Quickly add a new driver. You can add more details later in Setup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Driver Name *</Label>
              <Input
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                placeholder="Enter driver name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDriverOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDriver}>
              Add Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
