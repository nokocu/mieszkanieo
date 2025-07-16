import React, { useState, useEffect } from 'react'
import { Property, PropertyFilters } from '../types'
import { propertyService } from '../services/propertyService'
import Header from '../components/Header'
import PropertyCard from '../components/PropertyCard'

const Home: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [isRefreshExpanded, setIsRefreshExpanded] = useState(false)
  const [filters, setFilters] = useState<PropertyFilters>({
    sites: ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'], // Start with all sites selected
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

  const handleFiltersToggle = () => {
    setIsFilterExpanded(!isFilterExpanded)
    setIsRefreshExpanded(false) // Close refresh panel if open
  }

  const handleRefreshToggle = () => {
    setIsRefreshExpanded(!isRefreshExpanded)
    setIsFilterExpanded(false) // Close filter panel if open
  }

  const handleScrapeClick = () => {
    // TODO: scraping
  }

  if (loading && properties.length === 0) {
    return (
      <div className="" style={{ minHeight: '100vh' }}>
        <div className="" role="status">
          <span className="">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header 
        isFilterExpanded={isFilterExpanded}
        isRefreshExpanded={isRefreshExpanded}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onFiltersToggle={handleFiltersToggle}
        onRefreshToggle={handleRefreshToggle}
        onScrapeClick={handleScrapeClick}
      />

      <main>
        <section className=""></section>
        {/* Add extra spacing when navbar is expanded */}
        {(isFilterExpanded || isRefreshExpanded) && <section className=""></section>}

        <div className="">
          <div className="">
            {error && (
              <div className="" role="alert">
                {error}
              </div>
            )}
            
            {loading && (
              <div className="">
                <div className="" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            <div className="">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {!loading && properties.length === 0 && !error && (
              <div className="">
                <p className="">No properties found for the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
