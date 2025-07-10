import React, { useState, useEffect } from 'react'
import { Property, PropertyFilters } from '../types'
import { propertyService } from '../services/propertyService'
import Header from '../components/Header'
import PropertyCard from '../components/PropertyCard'
import PropertyFilter from '../components/PropertyFilter'

const Home: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [city, setCity] = useState('krak')
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<PropertyFilters>({
    city: 'krak',
    sites: [],
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
    const updatedFilters = { ...filters, city }
    setFilters(updatedFilters)
    fetchProperties()
  }, [city])

  const handleCityChange = (newCity: string) => {
    setCity(newCity)
  }

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    fetchProperties()
  }

  const handleRefresh = () => {
    fetchProperties()
  }

  if (loading && properties.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header 
        city={city}
        onCityChange={handleCityChange}
        onFiltersClick={() => setIsFilterModalOpen(true)}
        onRefreshClick={handleRefresh}
      />

      <main>
        <section className="py-3"></section>

        <div className="album py-5 bg-body-tertiary">
          <div className="container">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            {loading && (
              <div className="d-flex justify-content-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {!loading && properties.length === 0 && !error && (
              <div className="text-center py-5">
                <p className="text-muted">No properties found for the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <PropertyFilter
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  )
}

export default Home
