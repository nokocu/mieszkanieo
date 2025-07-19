import React, { useState, useEffect } from 'react'
import { Property, PropertyFilters } from '../../types'
import { propertyService } from '../../lib/propertyService'
import PropertyCard from '../../components/PropertyCard'

const PropertiesRoute: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<PropertyFilters>({
    sites: ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'],
    sortBy: 'price_asc'
  })

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
          className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
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
              setFilters({ ...filters, sites: updatedSites })
            }}
            className={`px-3 py-2 rounded-lg text-sm ${
              filters.sites?.includes(site as any)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {site.charAt(0).toUpperCase() + site.slice(1)}
          </button>
        ))}
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {!loading && properties.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No properties found</p>
        </div>
      )}
    </div>
  )
}

export default PropertiesRoute
