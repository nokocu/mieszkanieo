import * as React from "react"
import { App as AppSidebar } from './Sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from './ui/sidebar'
import { Navbar } from './Navbar'
import { Toaster } from './ui/sonner'
import Properties from './Properties'

export function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Navbar />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Properties />
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
