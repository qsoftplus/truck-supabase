"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Truck, Wallet, Settings, FileText, Disc } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Trip Sheet", href: "/trip-sheet", icon: FileText },
  { name: "Payment Status", href: "/payment-status", icon: Wallet },
  { name: "Tyre Details", href: "/tyre-details", icon: Disc },
  { name: "Setup", href: "/setup", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center px-6">
        <Truck className="h-8 w-8 text-indigo-400" />
        <span className="ml-3 text-xl font-bold">TruckPro</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-white"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-xs font-medium">AD</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-slate-400">admin@truckpro.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
