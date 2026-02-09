import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrucksList } from "@/features/trucks/components/trucks-list"
import { DriversList } from "@/features/drivers/components/drivers-list"
import { getTrucks } from "@/features/trucks/actions"
import { getDrivers } from "@/features/drivers/actions"

export default async function SetupPage() {
  const [trucksRes, driversRes] = await Promise.all([
    getTrucks(),
    getDrivers()
  ])

  const trucks = trucksRes.success ? (trucksRes.data || []) : []
  const drivers = driversRes.success ? (driversRes.data || []) : []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Setup
        </h1>
      </div>
      
      <Tabs defaultValue="trucks" className="space-y-4">
        <TabsList className="bg-muted/50 border">
          <TabsTrigger value="trucks" className="px-8">Trucks</TabsTrigger>
          <TabsTrigger value="drivers" className="px-8">Drivers</TabsTrigger>
        </TabsList>
        <TabsContent value="trucks" className="space-y-4">
          <TrucksList data={trucks as any[]} />
        </TabsContent>
        <TabsContent value="drivers" className="space-y-4">
          <DriversList data={drivers as any[]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
