import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PropertyFilter from '@/components/PropertyFilter'
import PropertyCard from '@/components/PropertyCard'
import { Property, PropertyFilters, ScrapingJob } from '@/types'
import { propertyService } from '@/services/propertyService'

const Home = () => {
  const [filters, setFilters] = useState<PropertyFilters>({
    city: 'krakow',
    sites: ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'],
    sortBy: 'price_asc'
  })

  const queryClient = useQueryClient()

  // fetch properties based on current filters
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertyService.getProperties(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // scraping mutation
  const scrapeMutation = useMutation({
    mutationFn: (city: string) => propertyService.scrapeCity(city),
    onSuccess: () => {
      // refresh properties after successful scraping
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters)
  }

  const handleScrapeData = (city: string) => {
    scrapeMutation.mutate(city)
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading properties</h3>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PropertyFilter
        onFiltersChange={handleFiltersChange}
        onScrapeData={handleScrapeData}
        isLoading={scrapeMutation.isPending}
      />

      {scrapeMutation.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-medium">Scraping Error</h3>
          <p className="text-red-600 text-sm mt-1">
            {scrapeMutation.error instanceof Error ? scrapeMutation.error.message : 'Failed to scrape data'}
          </p>
        </div>
      )}

      {scrapeMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-green-800 font-medium">Scraping Started</h3>
          <p className="text-green-600 text-sm mt-1">
            Data scraping has been initiated. Results will appear shortly.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Properties in {filters.city}
        </h2>
        <div className="text-sm text-gray-600">
          {isLoading ? 'Loading...' : `${properties.length} properties found`}
        </div>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            No properties found for your search criteria.
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your filters or scraping new data for this city.
          </p>
        </div>
      ) : (
        <div className="property-grid">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Home
