"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTrip, updateTrip } from "../actions"
import { CreateTrip } from "../schema"

interface TripFormProps {
  trucks: any[]
  drivers: any[]
  trip?: any // If provided, we are in edit mode
  onSuccess?: () => void
}

export function TripForm({ trucks, drivers, trip, onSuccess }: TripFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Initialize form data
  const [formData, setFormData] = useState<Partial<CreateTrip>>({
    truck_id: trip?.truck_id || "",
    driver1_id: trip?.driver1_id || "",
    driver2_id: trip?.driver2_id || null, // correctly handle nullable
    start_date: trip?.start_date || new Date().toISOString().split("T")[0],
    start_km: trip?.start_km || 0,
    status: trip?.status || "ongoing",
  })

  // Handle Input Changes
  const handleChange = (field: keyof CreateTrip, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = { ...formData }
      
      // Handle empty string for optional driver2_id
      if (payload.driver2_id === "none" || payload.driver2_id === "") {
        payload.driver2_id = null
      }

      let res
      if (trip?.id) {
        res = await updateTrip({ ...payload, id: trip.id })
      } else {
        res = await createTrip(payload)
      }

      if (res.success) {
        router.refresh()
        if (onSuccess) onSuccess()
      } else {
        alert("Error: " + res.error)
      }
    } catch (err: any) {
      console.error(err)
      alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="truck_id">Select Truck</Label>
        <Select 
          value={formData.truck_id} 
          onValueChange={(val) => handleChange("truck_id", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a truck" />
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

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="driver1_id">Primary Driver</Label>
          <Select 
            value={formData.driver1_id} 
            onValueChange={(val) => handleChange("driver1_id", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Driver 1" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="driver2_id">Secondary Driver (Optional)</Label>
          <Select 
            value={formData.driver2_id || "none"} 
            onValueChange={(val) => handleChange("driver2_id", val === "none" ? null : val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Driver 2" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleChange("start_date", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="start_km">Start KM</Label>
          <Input
            id="start_km"
            type="number"
            value={formData.start_km || ""}
            onChange={(e) => handleChange("start_km", Number(e.target.value))}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : trip ? "Update Trip" : "Create Trip"}
      </Button>
    </form>
  )
}
