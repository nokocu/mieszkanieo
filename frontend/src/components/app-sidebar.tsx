import * as React from "react"
import {
  RefreshCw,
  Filter,
  Building,
  Calendar,
  AlertTriangle,
} from "lucide-react"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { Checkbox } from "./ui/checkbox"
import { Slider } from "./ui/slider"
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
import { propertyService } from "../lib/propertyService"

export function App({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Filter states
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 10000])
  const [areaRange, setAreaRange] = React.useState<[number, number]>([0, 200])
  const [roomsRange, setRoomsRange] = React.useState<[number, number]>([1, 6])
  const [selectedSites, setSelectedSites] = React.useState<string[]>(['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'])
  const [sortBy, setSortBy] = React.useState('price_asc')
  const [address, setAddress] = React.useState('')

  // Refresh states
  const [refreshing, setRefreshing] = React.useState(false)
  const [refreshJobId, setRefreshJobId] = React.useState<string | null>(null)
  const [refreshStatus, setRefreshStatus] = React.useState<string>('')
  const [lastRefresh, setLastRefresh] = React.useState<Date | null>(() => {
    const stored = localStorage.getItem('lastRefresh')
    return stored ? new Date(stored) : null
  })
  const [refreshCity, setRefreshCity] = React.useState('')
  const [refreshSites, setRefreshSites] = React.useState<{[key: string]: {enabled: boolean, pages: string}}>({
    allegro: { enabled: true, pages: 'all' },
    gethome: { enabled: true, pages: 'all' },
    nieruchomosci: { enabled: true, pages: 'all' },
    olx: { enabled: true, pages: 'all' },
    otodom: { enabled: true, pages: 'all' }
  })

  // Pass filter changes to parent (we'll need to implement this)
  React.useEffect(() => {
    // Store filters in localStorage or context so Properties component can access them
    const filters = {
      sites: selectedSites,
      sortBy,
      address,
      priceRange,
      areaRange,
      roomsRange
    }
    localStorage.setItem('propertyFilters', JSON.stringify(filters))
    // Dispatch custom event to notify Properties component
    window.dispatchEvent(new CustomEvent('filtersChanged', { detail: filters }))
  }, [selectedSites, sortBy, address, priceRange, areaRange, roomsRange])

  const toggleSite = (site: string) => {
    setSelectedSites(prev => 
      prev.includes(site) 
        ? prev.filter(s => s !== site)
        : [...prev, site]
    )
  }

  const toggleRefreshSite = (site: string) => {
    setRefreshSites(prev => ({
      ...prev,
      [site]: {
        ...prev[site],
        enabled: !prev[site].enabled
      }
    }))
  }

  const updateRefreshSitePages = (site: string, pages: string) => {
    setRefreshSites(prev => ({
      ...prev,
      [site]: {
        ...prev[site],
        pages
      }
    }))
  }

  const handleRefresh = async () => {
    if (!canRefresh) return

    setRefreshing(true)
    setRefreshStatus('Rozpoczynanie...')
    
    try {
      // get enabled sites
      const enabledSites = Object.entries(refreshSites)
        .filter(([, config]) => config.enabled)
        .map(([site]) => site)
      
      // prepare site pages mapping
      const sitePages: Record<string, string> = {}
      Object.entries(refreshSites).forEach(([site, config]) => {
        if (config.enabled) {
          sitePages[site] = config.pages
        }
      })

      // start refresh job
      const result = await propertyService.startRefresh(refreshCity, enabledSites, sitePages)
      
      if (result.success && result.jobId) {
        setRefreshJobId(result.jobId)
        setRefreshStatus('Scrapowanie w toku...')
        
        // start polling for status
        pollRefreshStatus(result.jobId)
        
      } else {
        throw new Error(result.error || 'Failed to start refresh')
      }
      
    } catch (error) {
      console.error('Refresh failed:', error)
      setRefreshStatus('Błąd podczas odświeżania')
      setRefreshing(false)
      
      // show error for a few seconds then clear
      setTimeout(() => {
        setRefreshStatus('')
      }, 5000)
    }
  }

  const pollRefreshStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResult = await propertyService.getRefreshStatus(jobId)
        
        if (statusResult.success && statusResult.job) {
          const job = statusResult.job
          
          // update status message
          if (job.status === 'running') {
            setRefreshStatus(`W toku... ${job.progress}% (${job.totalFound} znalezionych)`)
          } else if (job.status === 'completed') {
            setRefreshStatus(`Zakończono! Znaleziono ${job.totalFound} ogłoszeń`)
            const now = new Date()
            setLastRefresh(now)
            localStorage.setItem('lastRefresh', now.toISOString())
            
            // Store the city that was just scraped
            if (refreshCity.trim()) {
              const formattedCity = refreshCity.charAt(0).toUpperCase() + refreshCity.slice(1)
              localStorage.setItem('currentCity', formattedCity)
              window.dispatchEvent(new CustomEvent('cityChanged', { detail: { city: formattedCity } }))
            }
            
            setRefreshing(false)
            clearInterval(pollInterval)
            
            // clear status after 5 seconds
            setTimeout(() => {
              setRefreshStatus('')
              setRefreshJobId(null)
            }, 5000)
            
            // trigger properties refresh
            window.dispatchEvent(new CustomEvent('refreshCompleted'))
            
          } else if (job.status === 'failed') {
            setRefreshStatus(`Błąd: ${job.error || 'Nieznany błąd'}`)
            setRefreshing(false)
            clearInterval(pollInterval)
            
            // clear status after 10 seconds
            setTimeout(() => {
              setRefreshStatus('')
              setRefreshJobId(null)
            }, 10000)
          }
        }
      } catch (error) {
        console.error('Error polling status:', error)
        setRefreshStatus('Błąd podczas sprawdzania statusu')
        setRefreshing(false)
        clearInterval(pollInterval)
        
        setTimeout(() => {
          setRefreshStatus('')
          setRefreshJobId(null)
        }, 5000)
      }
    }, 2000) // poll every 2 seconds

    // cleanup if component unmounts
    return () => clearInterval(pollInterval)
  }

  const formatLastRefresh = (date: Date | null) => {
    if (!date) return 'Nigdy'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Przed chwilą'
    if (diffMins < 60) return `${diffMins} min temu`
    if (diffHours < 24) return `${diffHours} godz. temu`
    if (diffDays === 1) return 'Wczoraj'
    if (diffDays < 7) return `${diffDays} dni temu`
    
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const enabledSitesCount = Object.values(refreshSites).filter(site => site.enabled).length
  const canRefresh = refreshCity.trim() !== '' && enabledSitesCount > 0

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/properties">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
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
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtry Wyszukiwania
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4 p-2">
            
            {/* Sites */}
            <div>
              <h4 className="text-sm font-medium mb-2">Źródła</h4>
              <div className="space-y-2">
                {['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'].map((site) => (
                  <div key={site} className="flex items-center space-x-2">
                    <Checkbox
                      id={`filter-${site}`}
                      checked={selectedSites.includes(site)}
                      onCheckedChange={() => toggleSite(site)}
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

            {/* Price Range */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Cena: {priceRange[0]}zł - {priceRange[1] >= 10000 ? '10000+' : priceRange[1]}zł
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

            {/* Area Range */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Powierzchnia: {areaRange[0]}m² - {areaRange[1] >= 200 ? '200+' : areaRange[1]}m²
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

            {/* Rooms Range */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Pokoje: {roomsRange[0]} - {roomsRange[1] >= 6 ? '6+' : roomsRange[1]}
              </h4>
              <Slider
                value={roomsRange}
                onValueChange={(value) => setRoomsRange(value as [number, number])}
                max={6}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            {/* Address Search */}
            <div>
              <h4 className="text-sm font-medium mb-2">Adres</h4>
              <Input
                placeholder="Wpisz adres..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* REFRESH SECTION */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Odświeżanie Ogłoszeń
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4 p-2">
            
            {/* Last Refresh Info */}
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-xs">
                <div className="font-medium">Ostatnie:</div>
                <div className="text-muted-foreground">{formatLastRefresh(lastRefresh)}</div>
              </div>
            </div>

            {/* Status Display */}
            {refreshStatus && (
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {refreshStatus}
                </p>
              </div>
            )}

            {/* City Input */}
            <div>
              <h4 className="text-sm font-medium mb-2">Miasto *</h4>
              <Input
                placeholder="np. Kraków..."
                value={refreshCity}
                onChange={(e) => setRefreshCity(e.target.value)}
              />
            </div>

            {/* Sites for Refresh */}
            <div>
              <h4 className="text-sm font-medium mb-2">Portale ({enabledSitesCount}/5)</h4>
              <div className="space-y-2">
                {Object.entries(refreshSites).map(([site, config]) => (
                  <div key={site} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`refresh-${site}`}
                          checked={config.enabled}
                          onCheckedChange={() => toggleRefreshSite(site)}
                        />
                        <label htmlFor={`refresh-${site}`} className="text-sm capitalize cursor-pointer">
                          {site}
                        </label>
                      </div>
                      {config.enabled && (
                        <Input
                          value={config.pages}
                          onChange={(e) => updateRefreshSitePages(site, e.target.value)}
                          className="w-16 h-6 text-xs px-2"
                          placeholder="all"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Częste odświeżanie może prowadzić do blokowania dostępu.
                </p>
              </div>
            </div>

            {/* Refresh Button */}
            <Button 
              onClick={handleRefresh}
              disabled={!canRefresh || refreshing}
              className="w-full"
              size="sm"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  Ładowanie...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Załaduj nowe
                </>
              )}
            </Button>
            
            {!canRefresh && (
              <p className="text-xs text-muted-foreground text-center">
                {refreshCity.trim() === '' && 'Podaj nazwę miasta'}
                {refreshCity.trim() !== '' && enabledSitesCount === 0 && 'Wybierz portale'}
              </p>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
