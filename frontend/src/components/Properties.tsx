import React, { useState, useEffect } from 'react'
import { Property, PropertyFilters } from '../types'
import { propertyService } from '../lib/propertyService'
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "./ui/pagination"
import { MapPin, Building, DoorClosed, Ruler, ArrowBigUp } from 'lucide-react'
import { openUrl } from '@tauri-apps/plugin-opener'

const PropertiesShadcnRoute: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  // pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 80

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

    const handleRefreshCompleted = () => {
      // reload properties when refresh is completed
      fetchProperties()
    }

    window.addEventListener('filtersChanged', handleFiltersChanged as EventListener)
    window.addEventListener('refreshCompleted', handleRefreshCompleted as EventListener)

    return () => {
      window.removeEventListener('filtersChanged', handleFiltersChanged as EventListener)
      window.removeEventListener('refreshCompleted', handleRefreshCompleted as EventListener)
    }
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

  // reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  // calculate pagination values
  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentProperties = properties.slice(startIndex, endIndex)

  // handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // reusable pagination component
  const PaginationComponent = () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage > 1) handlePageChange(currentPage - 1)
            }}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        {/* Page numbers */}
        {totalPages <= 5 ? (
          // simple case
          Array.from({ length: totalPages }, (_, i) => {
            const pageNum = i + 1
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  isActive={pageNum === currentPage}
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(pageNum)
                  }}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          })
        ) : (
          // complex case
          <>
            {/* First page */}
            {currentPage > 3 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(1)
                    }}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {currentPage > 4 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}

            {/* Page numbers around current page */}
            {Array.from({ length: 5 }, (_, i) => {
              let pageNum
              if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              if (pageNum < 1 || pageNum > totalPages) return null

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    isActive={pageNum === currentPage}
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(pageNum)
                    }}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            {/* Last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(totalPages)
                    }}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
          </>
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage < totalPages) handlePageChange(currentPage + 1)
            }}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )

  const getSiteColor = (site: string) => {
    const colors: { [key: string]: string } = {
      allegro: 'bg-orange-500',
      gethome: 'bg-purple-400',
      nieruchomosci: 'bg-neutral-100 text-orange-500 border-neutral-300',
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
            <h1 className="text-3xl font-bold tracking-tight">Ogłoszenia</h1>
            <p className="text-muted-foreground">
              Ładowanie ogłoszeń...
            </p>
          </div>
        </div>

        {/* Skeleton Properties Grid */}
        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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
          <h1 className="text-3xl font-bold tracking-tight">Ogłoszenia</h1>
          <p className="text-muted-foreground">
            {properties.length} łącznie
          </p>
        </div>

        {/* Top Pagination */}
        {totalPages > 1 && (
          <div className="hidden lg:flex items-center ml-4">
            <PaginationComponent />
          </div>
        )}
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-6">
        {currentProperties.map((property) => (
          <Card
            key={property.id}
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-80 flex flex-col py-0 gap-0"
            onClick={() => openUrl(property.link)}
          >
            {/* Image Section */}
            <div className="h-48 relative bg-muted overflow-hidden">
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
            <div className="p-4 flex-1 flex flex-col justify-between">
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
                  {property.level !== null && property.level !== undefined && (
                    <div className="flex items-center">
                      <ArrowBigUp className="h-4 w-4 mr-1" />
                      <span className="xl:hidden 2xl:block">
                        {property.level === 0 ? 'parter' : `${property.level} piętro`}
                      </span>
                      <span className="hidden xl:block 2xl:hidden">
                        {property.level === 0 ? 'parter' : `${property.level}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div>
          <PaginationComponent />
        </div>
      )}

      {!loading && properties.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nie znaleziono ogłoszeń</h3>
            <p className="text-muted-foreground">
              Kliknij przycisk "Odśwież dane" aby załadować nowe ogłoszenia...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PropertiesShadcnRoute
