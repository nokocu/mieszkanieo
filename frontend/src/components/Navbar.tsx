import * as React from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Switch } from "./ui/switch"
import { SiteSwitch } from "./SiteSwitch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "./ui/dropdown-menu"
import { RefreshCw, AlertTriangle, Moon, Sun } from "lucide-react"
import { propertyService } from "../lib/propertyService"
import { toast } from "sonner"

export function Navbar() {
  // dark mode state
  const [darkMode, setDarkMode] = React.useState(() => {
    // check localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        return savedTheme === 'dark'
      }
      // if no saved theme check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // chromedriver compatibility state
  const [chromedriverStatus, setChromedriverStatus] = React.useState<{
    compatible: boolean
    checking: boolean
    needsChromeUpdate: boolean
    message: string
  }>({
    compatible: false,
    checking: true,
    needsChromeUpdate: false,
    message: 'Sprawdzanie kompatybilności...'
  })

  // refresh states
  const [refreshing, setRefreshing] = React.useState(false)
  const [refreshJobId, setRefreshJobId] = React.useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = React.useState<Date | null>(() => {
    const stored = localStorage.getItem('lastRefresh')
    return stored ? new Date(stored) : null
  })
  const [refreshCity, setRefreshCity] = React.useState(() => {
    // first try to get city from URL hash
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1) // remove #
      if (hash) {
        return hash.charAt(0).toUpperCase() + hash.slice(1)
      }
    }
    // try localStorage if available
    const stored = localStorage.getItem('currentCity')
    if (stored && stored !== 'Mieszkanieo') {
      return stored
    }
    return ''
  })
  const [refreshSites, setRefreshSites] = React.useState<{ [key: string]: boolean }>({
    allegro: true,
    gethome: true,
    nieruchomosci: true,
    olx: true,
    otodom: true
  })

  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  // handle dark mode initialization and system preference changes
  React.useEffect(() => {
    // set initial dark mode class
    document.documentElement.classList.toggle('dark', darkMode)

    // only listen for system preference changes if no manual preference is saved
    const savedTheme = localStorage.getItem('theme')
    if (!savedTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        setDarkMode(e.matches)
        document.documentElement.classList.toggle('dark', e.matches)
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [darkMode])

  // check chromedriver compatibility on mount
  React.useEffect(() => {
    const checkChromedriverStatus = async () => {
      setChromedriverStatus(prev => ({ ...prev, checking: true }))
      
      try {
        const status = await propertyService.getChromedriverStatus()
        
        setChromedriverStatus({
          compatible: status.compatible,
          checking: false,
          needsChromeUpdate: status.needs_chrome_update || false,
          message: status.message
        })
      } catch (error) {
        setChromedriverStatus({
          compatible: false,
          checking: false,
          needsChromeUpdate: false,
          message: 'Nie udało się sprawdzić kompatybilności'
        })
      }
    }

    checkChromedriverStatus()
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    
    // save theme preference to localStorage
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')
    
    // apply theme class
    document.documentElement.classList.toggle('dark', newDarkMode)
  }

  // handle city change - update localStorage and dispatch event
  const handleCityChange = (newCity: string) => {
    setRefreshCity(newCity)
    if (newCity.trim()) {
      const formattedCity = newCity.charAt(0).toUpperCase() + newCity.slice(1)
      localStorage.setItem('currentCity', formattedCity)
      // dispatch city change event for properties component
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: { city: formattedCity } }))
    } else {
      localStorage.removeItem('currentCity')
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: { city: 'Mieszkanieo' } }))
    }
  }

  const toggleRefreshSite = (site: string) => {
    setRefreshSites(prev => ({
      ...prev,
      [site]: !prev[site]
    }))
  }

  const enabledSitesCount = Object.values(refreshSites).filter(enabled => enabled).length
  const canRefresh = refreshCity.trim() !== '' && enabledSitesCount > 0 && chromedriverStatus.compatible && !chromedriverStatus.checking

  const handleRefresh = async () => {
    if (!canRefresh) return

    setRefreshing(true)
    setDropdownOpen(false)

    // show initial toast
    toast.loading("Rozpoczynanie...", {
      id: "scraping-status"
    })

    try {
      // get enabled sites
      const enabledSites = Object.entries(refreshSites)
        .filter(([, enabled]) => enabled)
        .map(([site]) => site)

      // prepare site pages mapping (old, now all sites use 'all' pages)
      const sitePages: Record<string, string> = {}
      enabledSites.forEach(site => {
        sitePages[site] = 'all'
      })

      // start refresh job
      const result = await propertyService.startRefresh(refreshCity, enabledSites, sitePages)

      if (result.success && result.jobId) {
        setRefreshJobId(result.jobId)

        // start polling for status
        pollRefreshStatus(result.jobId)

      } else {
        throw new Error(result.error || 'Failed to start refresh')
      }

    } catch (error) {
      console.error('Refresh failed:', error)
      setRefreshing(false)

      toast.error("Błąd podczas odświeżania", {
        id: "scraping-status",
        description: error instanceof Error ? error.message : "Nieznany błąd"
      })
    }
  }

  const pollRefreshStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResult = await propertyService.getRefreshStatus(jobId)

        if (statusResult.success && statusResult.job) {
          const job = statusResult.job

          // update toast with progress
          if (job.status === 'running') {
            const statusMessage = job.currentStatus || `Pozyskiwanie ogłoszeń... ${job.progress}%`
            const foundMessage = `${job.totalFound} znalezionych`

            toast.loading(statusMessage, {
              id: "scraping-status",
              description: foundMessage
            })
          } else if (job.status === 'completed') {
            const now = new Date()
            setLastRefresh(now)
            localStorage.setItem('lastRefresh', now.toISOString())

            // store the city that was just scraped
            if (refreshCity.trim()) {
              const formattedCity = refreshCity.charAt(0).toUpperCase() + refreshCity.slice(1)
              localStorage.setItem('currentCity', formattedCity)
              window.dispatchEvent(new CustomEvent('cityChanged', { detail: { city: formattedCity } }))
            }

            setRefreshing(false)
            clearInterval(pollInterval)
            setRefreshJobId(null)

            toast.success(`Zakończono!`, {
              id: "scraping-status",
              description: `Znaleziono ${job.totalFound} ogłoszeń`
            })

            // trigger properties refresh
            window.dispatchEvent(new CustomEvent('refreshCompleted'))

          } else if (job.status === 'failed') {
            setRefreshing(false)
            clearInterval(pollInterval)
            setRefreshJobId(null)

            toast.error("Błąd podczas scrapowania", {
              id: "scraping-status",
              description: job.error || 'Nieznany błąd'
            })
          }
        }
      } catch (error) {
        console.error('Error polling status:', error)
        setRefreshing(false)
        clearInterval(pollInterval)
        setRefreshJobId(null)

        toast.error("Błąd podczas sprawdzania statusu", {
          id: "scraping-status"
        })
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

  return (
    <>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 h-8 px-3 hover:bg-accent"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Odśwież dane</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="start">
              <DropdownMenuLabel className="text-base">Odśwież</DropdownMenuLabel>


              <DropdownMenuSeparator />

              {/* City Input */}
              <div className="p-3">
                <label className="text-sm font-medium mb-2 block">Miasto</label>
                <Input
                  placeholder="np. Kraków..."
                  value={refreshCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full"
                />
              </div>

              <DropdownMenuSeparator />

              {/* Sources Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center justify-between">
                  <span className="pl-1 pr-1">Źródła</span>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground">({enabledSitesCount}/5)</span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-43">
                  <div className="p-2 space-y-3">
                    {Object.entries(refreshSites).map(([site, enabled]) => (
                      <div key={site} className="flex items-center">
                        <SiteSwitch
                          className="mr-2"
                          id={`refresh-${site}`}
                          checked={enabled}
                          onCheckedChange={() => toggleRefreshSite(site)}
                          site={site as "allegro" | "gethome" | "nieruchomosci" | "olx" | "otodom"}
                        />
                        <label htmlFor={`refresh-${site}`} className="text-sm capitalize cursor-pointer">
                          {site}
                        </label>
                      </div>
                    ))}
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Disclaimer at bottom */}
              <div className="m-2 p-3 bg-amber-50 dark:bg-amber-950/20 border rounded border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Częste odświeżanie może prowadzić do blokad od dostawców ogłoszeń, zmniejszając liczbę wczytanych ogłoszeń przez Mieszkanieo.
                  </p>
                </div>
              </div>
              {/* Refresh Button */}
              <div className="p-3">
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
                  ) : chromedriverStatus.checking ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                      Sprawdzanie...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Wczytaj nowe
                    </>
                  )}
                </Button>

                {!canRefresh && !refreshing && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {chromedriverStatus.checking && 'Sprawdzanie kompatybilności...'}
                    {!chromedriverStatus.checking && !chromedriverStatus.compatible && 'Zaktualizuj Google Chrome do nowszej wersji aby kontynuować'}
                    {!chromedriverStatus.checking && chromedriverStatus.compatible && refreshCity.trim() === '' && 'Podaj nazwę miasta'}
                    {!chromedriverStatus.checking && chromedriverStatus.compatible && refreshCity.trim() !== '' && enabledSitesCount === 0 && 'Wybierz portale'}
                  </p>
                )}
              </div>


            </DropdownMenuContent>
          </DropdownMenu>

          {/* Last refresh info below button */}
          <div className="text-xs text-muted-foreground">
            {formatLastRefresh(lastRefresh)}
          </div>
        </div>

        {/* Dark mode button on the right */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            className="h-8 w-8"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  )
}
