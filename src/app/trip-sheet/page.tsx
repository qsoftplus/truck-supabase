import { Suspense } from "react"
import { TripsList } from "@/features/trips/components/trips-list"
import { getTrips } from "@/features/trips/actions"
import { getTrucks } from "@/features/trucks/actions"
import { getDrivers } from "@/features/drivers/actions"

export default async function TripSheetPage() {
  const [tripsRes, trucksRes, driversRes] = await Promise.all([
    getTrips(),
    getTrucks(),
    getDrivers()
  ])

  const trips = tripsRes.success ? (tripsRes.data || []) : []
  const trucks = trucksRes.success ? (trucksRes.data || []) : []
  const drivers = driversRes.success ? (driversRes.data || []) : []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Trip Sheet
        </h1>
      </div>
      
      <Suspense fallback={<div>Loading trips...</div>}>
        <TripsList trips={trips as any[]} trucks={trucks as any[]} drivers={drivers as any[]} />
      </Suspense>
    </div>
  )
}
