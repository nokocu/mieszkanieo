import * as React from "react"
import { App as AppSidebar } from './app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from './ui/sidebar'
import { Separator } from './ui/separator'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from './ui/breadcrumb'
import Properties from '../app/routes/properties'

export function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Mieszkanieo - Porównywarka cen wynajmu mieszkań</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Properties />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
