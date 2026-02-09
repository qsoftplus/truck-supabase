import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentStatusView } from "@/features/payments/components/payment-status-view"
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

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manage">Manage Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage" className="mt-6">
          <Suspense fallback={<div>Loading...</div>}>
            <PaymentStatusForm trucks={trucks} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          <Suspense fallback={<div>Loading...</div>}>
            <PaymentStatusView />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
