import * as React from "react"
import {
  Filter,
  Building,
} from "lucide-react"

import { Input } from "./ui/input"
import { Separator } from "./ui/separator"
import { Slider } from "./ui/slider"
import { SiteSwitch } from "./SiteSwitch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "./ui/sidebar"

export function App({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // filter states
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 10000])
  const [areaRange, setAreaRange] = React.useState<[number, number]>([0, 200])
  const [roomsRange, setRoomsRange] = React.useState<[number, number]>([1, 8])
  const [selectedSites, setSelectedSites] = React.useState<string[]>(['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'])
  const [sortBy, setSortBy] = React.useState('price_asc')
  const [address, setAddress] = React.useState('')

  // pass filter changes to parent
  React.useEffect(() => {
    const filters = {
      sites: selectedSites,
      sortBy,
      address,
      priceRange,
      areaRange,
      roomsRange
    }
    localStorage.setItem('propertyFilters', JSON.stringify(filters))
    // dispatch custom event to notify Properties component
    window.dispatchEvent(new CustomEvent('filtersChanged', { detail: filters }))
  }, [selectedSites, sortBy, address, priceRange, areaRange, roomsRange])

  const toggleSite = (site: string) => {
    setSelectedSites(prev =>
      prev.includes(site)
        ? prev.filter(s => s !== site)
        : [...prev, site]
    )
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Building className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Mieszkanieo</span>
                  <span className="truncate text-xs">Porównywarka cen</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>



      <SidebarContent>
        {/* FILTERING SECTION */}
        <SidebarGroup className="pt-0">

          <Separator />
          <SidebarGroupContent className="space-y-4 p-2">

            {/* Sites */}
            <div>
              <div className="mt-2 space-y-3">
                {['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'].map((site) => (
                  <div key={site} className="flex items-center space-x-2">
                    <SiteSwitch
                      id={`filter-${site}`}
                      checked={selectedSites.includes(site)}
                      onCheckedChange={() => toggleSite(site)}
                      site={site as "allegro" | "gethome" | "nieruchomosci" | "olx" | "otodom"}
                    />
                    <label htmlFor={`filter-${site}`} className="text-sm capitalize cursor-pointer">
                      {site}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Sort */}
            <div>
              <h4 className="text-sm font-medium mb-2">Sortuj według</h4>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_asc">Cena: od najtańszych</SelectItem>
                  <SelectItem value="price_desc">Cena: od najdroższych</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />
            {/* Address Search */}
            <div>
              <h4 className="text-sm font-medium mb-2">Adres</h4>
              <Input
                placeholder="Wpisz adres..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Separator />

            {/* Price Range */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Cena
              </h4>
              <h4 className="text-xs font-medium mb-2 text-center">
                {priceRange[0]}zł - {priceRange[1] >= 10000 ? '10000+ ' : priceRange[1]}zł
              </h4>
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                max={10000}
                min={0}
                step={100}
                className="w-full"
              />
            </div>
            <Separator />
            {/* Area Range */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Powierzchnia
              </h4>
              <h4 className="text-xs mb-2 text-center">
                {areaRange[0]}m² - {areaRange[1] >= 200 ? '200+ ' : areaRange[1]}m²
              </h4>
              <Slider
                value={areaRange}
                onValueChange={(value) => setAreaRange(value as [number, number])}
                max={200}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
            <Separator />
            {/* Rooms Range */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Pokoje
              </h4>
              <h4 className="text-xs mb-2 text-center">
                {roomsRange[0]} - {roomsRange[1] >= 8 ? '8+' : roomsRange[1]}
              </h4>
              <Slider
                value={roomsRange}
                onValueChange={(value) => setRoomsRange(value as [number, number])}
                max={8}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
