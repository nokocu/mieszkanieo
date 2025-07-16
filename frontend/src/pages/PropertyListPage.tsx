import React, { useState, useEffect } from 'react'
import { Property, PropertyFilters } from '../types'
import { propertyService } from '../services/propertyService'
import PropertyCard from '../components/PropertyCard'

const PropertyListPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PropertyFilters>({
    sites: ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'],
    sortBy: 'price_asc'
  })

  const fetchProperties = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await propertyService.getProperties(filters)
      setProperties(data)
    } catch (err) {
      setError('Failed to fetch properties')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [filters])

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters)
  }

  const handleScrapeClick = () => {
    // TODO: scraping functionality
  }

  if (loading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <span className="text-gray-500 dark:text-gray-400">Loading properties...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Properties</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {properties.length} properties found
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleScrapeClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className=" rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filters</h2>
        
        {/* Site Filters */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-3">
            <select
                value={filters.sortBy}
                onChange={(e) => handleFiltersChange({ ...filters, sortBy: e.target.value as any })}
                className="block w-48 px-3 py-2 border border-neutral-300 rounded-full shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-900 dark:border-neutral-600 dark:text-white"
            >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
            </select>
            {['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'].map((site) => (
              <button
                key={site}
                onClick={() => {
                  const currentSites = filters.sites || []
                  const updatedSites = currentSites.includes(site as any)
                    ? currentSites.filter(s => s !== site)
                    : [...currentSites, site as any]
                  handleFiltersChange({ ...filters, sites: updatedSites })
                }}
                className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.sites?.includes(site as any)
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-neutral-100 text-gray-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
                }`}
              >
                <img 
                  src={`/logo_${site.charAt(0)}.png`} 
                  alt={site}
                  className="w-4 h-4 mr-2"
                />
                {site.charAt(0).toUpperCase() + site.slice(1)}
              </button>
            ))}
            
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      )}

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {/* Empty State */}
      {!loading && properties.length === 0 && !error && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No properties found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your filters or refresh the data.
          </p>
        </div>
      )}
    </div>
  )
}

export default PropertyListPage
