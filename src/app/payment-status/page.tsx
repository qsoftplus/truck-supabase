import { Suspense } from "react"
import { PaymentStatusContainer } from "@/features/payments/components/payment-status-container"
import { getTrucks } from "@/features/trucks/actions"
import { getDrivers } from "@/features/drivers/actions"

export default async function PaymentStatusPage() {
  const [trucksRes, driversRes] = await Promise.all([
    getTrucks(),
    getDrivers()
  ])

  const trucks = trucksRes.success ? (trucksRes.data || []) : []
  const drivers = driversRes.success ? (driversRes.data || []) : []

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <Suspense fallback={<div>Loading...</div>}>
        <PaymentStatusContainer trucks={trucks} drivers={drivers} />
      </Suspense>
    </div>
  )
}
