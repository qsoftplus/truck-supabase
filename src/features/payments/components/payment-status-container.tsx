"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  ArrowLeft
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { PaymentStatusView } from "./payment-status-view"
import { PaymentStatusForm } from "./payment-status-form"

interface PaymentStatusContainerProps {
  trucks: any[]
  drivers: any[]
}

export function PaymentStatusContainer({ trucks, drivers }: PaymentStatusContainerProps) {
  const router = useRouter()
  // "view" = table list view, "create" = add/manage form
  const [viewMode, setViewMode] = useState<"view" | "create">("view")
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)

  const handleCreateNew = () => {
    setSelectedTripId(null)
    setViewMode("create")
  }

  const handleEditTrip = (tripId: string) => {
    setSelectedTripId(tripId)
    setViewMode("create")
  }

  const handleBackToView = () => {
    setViewMode("view")
    setSelectedTripId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Payment Status
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and record payments for trips
          </p>
        </div>
        
        {viewMode === "view" ? (
          <Button onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Record New Payment
          </Button>
        ) : (
          <Button variant="outline" onClick={handleBackToView}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        )}
      </div>

      {viewMode === "view" ? (
        <PaymentStatusView 
          trucks={trucks} 
          drivers={drivers} 
          onEditTrip={handleEditTrip}
        />
      ) : (
        <PaymentStatusForm 
          trucks={trucks} 
          initialTripId={selectedTripId}
          onSuccess={handleBackToView}
        />
      )}
    </div>
  )
}
