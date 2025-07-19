import React, { useState, useEffect } from 'react'
import { Property, PropertyFilters } from '../../types'
import { propertyService } from '../../lib/propertyService'
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { Checkbox } from "../../components/ui/checkbox"
import { Slider } from "../../components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { MapPin, Building, DoorClosed, Ruler, Filter, X, Moon, Sun, ArrowBigUp } from 'lucide-react'

const PropertiesShadcnRoute: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    // Check system preference on initialization
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const [filters, setFilters] = useState<PropertyFilters>({
    sites: ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'],
    sortBy: 'price_asc'
  })

  // Price range state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 200])
  const [roomsRange, setRoomsRange] = useState<[number, number]>([1, 6])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const filtersWithRanges = {
        ...filters,
        priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
        priceMax: priceRange[1] < 10000 ? priceRange[1] : undefined,
        areaMin: areaRange[0] > 0 ? areaRange[0] : undefined,
        areaMax: areaRange[1] < 200 ? areaRange[1] : undefined,
        roomsMin: roomsRange[0] > 1 ? roomsRange[0] : undefined,
        roomsMax: roomsRange[1] < 6 ? roomsRange[1] : undefined,
      }
      const data = await propertyService.getProperties(filtersWithRanges)
      setProperties(data)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [filters, priceRange, areaRange, roomsRange])

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

  const toggleSite = (site: string) => {
    const currentSites = filters.sites || []
    const updatedSites = currentSites.includes(site as any)
      ? currentSites.filter(s => s !== site)
      : [...currentSites, site as any]
    setFilters({ ...filters, sites: updatedSites })
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark', !darkMode)
  }

  const clearFilters = () => {
    setFilters({
      sites: ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'],
      sortBy: 'price_asc'
    })
    setPriceRange([0, 10000])
    setAreaRange([0, 200])
    setRoomsRange([1, 6])
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Ukryj Filtry' : 'Filtruj'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtry</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Resetuj
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sites */}
            <div>
              <h3 className="text-sm font-medium mb-3">Źródła</h3>
              <div className="flex flex-wrap gap-2">
                {['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'].map((site) => (
                  <div key={site} className="flex items-center space-x-2">
                    <Checkbox
                      id={site}
                      checked={filters.sites?.includes(site as any)}
                      onCheckedChange={() => toggleSite(site)}
                    />
                    <label
                      htmlFor={site}
                      className="text-sm font-medium capitalize cursor-pointer"
                    >
                      {site}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Sort */}
            <div>
              <h3 className="text-sm font-medium mb-3">Sortuj według</h3>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}>
                <SelectTrigger className="w-48">
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
              <h3 className="text-sm font-medium mb-3">
                Zakres cen: {priceRange[0]}zł - {priceRange[1] >= 10000 ? '10000+' : priceRange[1]}zł
              </h3>
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
              <h3 className="text-sm font-medium mb-3">
                Powierzchnia: {areaRange[0]}m² - {areaRange[1] >= 200 ? '200+' : areaRange[1]}m²
              </h3>
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
              <h3 className="text-sm font-medium mb-3">
                Pokoje: {roomsRange[0]} - {roomsRange[1] >= 6 ? '6+' : roomsRange[1]}
              </h3>
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
              <h3 className="text-sm font-medium mb-3">Location</h3>
              <Input
                placeholder="Search by address..."
                value={filters.address || ''}
                onChange={(e) => setFilters({ ...filters, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {properties.map((property) => (
          <Card 
            key={property.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-80 p-0"
            onClick={() => window.open(property.link, '_blank')}
          >
            {/* Image Section - 70% height */}
            <div className="h-[60%] relative bg-muted">
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
            
            {/* Content Section - 30% height */}
            <div className="h-[30%] p-4 pt-0 pb-0 flex flex-col">
              <div className="flex-1 min-h-0">
                <h3 className="text-sm font-semibold leading-tight line-clamp-2 mb-1">
                  {property.title}
                </h3>
                <div className="flex items-center text-muted-foreground text-xs">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{property.address}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-auto">
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
            <h3 className="text-lg font-medium mb-2">No properties found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters to see more results
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PropertiesShadcnRoute
