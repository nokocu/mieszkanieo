import React, { useState, useEffect } from 'react'
import { Property, PropertyFilters } from '../../types'
import { propertyService } from '../../lib/propertyService'
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { MapPin, Building, DoorClosed, Ruler, Moon, Sun, ArrowBigUp } from 'lucide-react'

const PropertiesShadcnRoute: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    // Check system preference on initialization
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  
  // get filters from sidebar (localStorage + event listener)
  const [filters, setFilters] = useState<PropertyFilters>(() => {
    const stored = localStorage.getItem('propertyFilters')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return {
          sites: parsed.sites || ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'],
          sortBy: parsed.sortBy || 'price_asc',
          address: parsed.address || '',
          priceMin: parsed.priceRange?.[0] > 0 ? parsed.priceRange[0] : undefined,
          priceMax: parsed.priceRange?.[1] < 10000 ? parsed.priceRange[1] : undefined,
          areaMin: parsed.areaRange?.[0] > 0 ? parsed.areaRange[0] : undefined,
          areaMax: parsed.areaRange?.[1] < 200 ? parsed.areaRange[1] : undefined,
          roomsMin: parsed.roomsRange?.[0] > 1 ? parsed.roomsRange[0] : undefined,
          roomsMax: parsed.roomsRange?.[1] < 6 ? parsed.roomsRange[1] : undefined,
        }
      } catch {
        return {
          sites: ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'],
          sortBy: 'price_asc'
        }
      }
    }
    return {
      sites: ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'],
      sortBy: 'price_asc'
    }
  })

  // listen for filter changes from sidebar
  React.useEffect(() => {
    const handleFiltersChanged = (event: CustomEvent) => {
      const sidebarFilters = event.detail
      setFilters({
        sites: sidebarFilters.sites || ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'],
        sortBy: sidebarFilters.sortBy || 'price_asc',
        address: sidebarFilters.address || '',
        priceMin: sidebarFilters.priceRange?.[0] > 0 ? sidebarFilters.priceRange[0] : undefined,
        priceMax: sidebarFilters.priceRange?.[1] < 10000 ? sidebarFilters.priceRange[1] : undefined,
        areaMin: sidebarFilters.areaRange?.[0] > 0 ? sidebarFilters.areaRange[0] : undefined,
        areaMax: sidebarFilters.areaRange?.[1] < 200 ? sidebarFilters.areaRange[1] : undefined,
        roomsMin: sidebarFilters.roomsRange?.[0] > 1 ? sidebarFilters.roomsRange[0] : undefined,
        roomsMax: sidebarFilters.roomsRange?.[1] < 6 ? sidebarFilters.roomsRange[1] : undefined,
      })
    }

    window.addEventListener('filtersChanged', handleFiltersChanged as EventListener)
    return () => window.removeEventListener('filtersChanged', handleFiltersChanged as EventListener)
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const data = await propertyService.getProperties(filters)
      setProperties(data)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [filters])

  // Handle dark mode initialization and system preference changes
  useEffect(() => {
    // Set initial dark mode class
    document.documentElement.classList.toggle('dark', darkMode)
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches)
      document.documentElement.classList.toggle('dark', e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark', !darkMode)
  }

  const getSiteColor = (site: string) => {
    const colors: { [key: string]: string } = {
      allegro: 'bg-orange-600',
      gethome: 'bg-purple-400',
      nieruchomosci: 'bg-neutral-100 text-orange-600 border-neutral-300',
      olx: 'bg-teal-400 text-black border-neutral-700',
      otodom: 'bg-green-500 text-blue-950'
    }
    return colors[site] || 'bg-muted text-muted-foreground border-border'
  }

  // skeleton component for loading state
  const PropertySkeleton = () => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-80 p-0">
      {/* Image skeleton */}
      <div className="h-[70%] relative bg-muted overflow-hidden animate-pulse">
        <div className="w-full h-full bg-neutral-300 dark:bg-neutral-700"></div>
        {/* Site badge skeleton */}
        <div className="absolute bottom-2 left-2 w-16 h-4 bg-neutral-400 dark:bg-neutral-600 rounded animate-pulse"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="pl-4 pr-4 pb-4 flex flex-col">
        <div className="flex-1 min-h-0">
          {/* Title skeleton */}
          <div className="space-y-2 mb-1">
            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded mb-1 animate-pulse"></div>
            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4 animate-pulse"></div>
          </div>
          {/* Address skeleton */}
          <div className="flex items-center mb-2">
            <div className="h-3 w-3 bg-neutral-300 dark:bg-neutral-700 rounded mr-1 animate-pulse"></div>
            <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-2/3 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          {/* Price skeleton */}
          <div className="h-5 bg-neutral-300 dark:bg-neutral-700 rounded w-24 animate-pulse"></div>
          {/* Details skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-12 animate-pulse"></div>
            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-8 animate-pulse"></div>
            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-8 animate-pulse"></div>
          </div>
        </div>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mieszkanieo</h1>
            <p className="text-muted-foreground">
              Ładowanie ogłoszeń...
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={toggleDarkMode}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Skeleton Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <PropertySkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mieszkanieo</h1>
          <p className="text-muted-foreground">
            {properties.length} ogłoszeń
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={toggleDarkMode}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-0">
        {properties.map((property) => (
          <Card 
            key={property.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-80 p-0"
            onClick={() => window.open(property.link, '_blank')}
          >
            {/* Image Section */}
            <div className="h-[70%] relative bg-muted overflow-hidden">
              {property.image ? (
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <Badge 
                className={`absolute bottom-2 left-2 ${getSiteColor(property.site)}`}
                variant="secondary"
              >
                {property.site}
              </Badge>
            </div>
            
            {/* Content Section */}
            <div className="pl-4 pr-4 pb-4 flex flex-col">
              {/* Title and Location */}
              <div>
                <h3 className="text-sm font-semibold leading-tight line-clamp-2 mb-1">
                  {property.title}
                </h3>
                <div className="flex items-center text-muted-foreground text-xs mb-2">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{property.address}</span>
                </div>
              </div>
              
              {/* Spacer to push details to bottom */}
              <div className="flex-1"></div>
              
              {/* Price and Details */}
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-foreground">
                  {property.price.toLocaleString()} zł
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {property.area && (
                    <div className="flex items-center">
                      <Ruler className="h-3 w-3 mr-1" />
                      {property.area}m²
                    </div>
                  )}
                  {property.rooms && (
                    <div className="flex items-center">
                      <DoorClosed className="h-3 w-3 mr-1" />
                      {property.rooms}
                    </div>
                  )}
                  {property.level && (
                    <div className="flex items-center">
                      <ArrowBigUp className="h-4 w-4 mr-1" />
                      {property.level}p
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!loading && properties.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nie znaleziono ogłoszeń</h3>
            <p className="text-muted-foreground">
              Tutaj powinny być ogłoszenia...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PropertiesShadcnRoute
