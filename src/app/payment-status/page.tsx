import { Suspense } from "react"
import { PaymentStatusForm } from "@/features/payments/components/payment-status-form"
import { getTrucks } from "@/features/trucks/actions"

export default async function PaymentStatusPage() {
  const trucksRes = await getTrucks()
  const trucks = trucksRes.success ? (trucksRes.data || []) : []

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Payment Status
        </h1>
        <p className="text-muted-foreground mt-1">
          Track and manage payments for trips
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <PaymentStatusForm trucks={trucks} />
      </Suspense>
    </div>
  )
}
