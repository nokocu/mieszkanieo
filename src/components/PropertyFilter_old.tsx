import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Search, Settings, RotateCcw } from 'lucide-react'
import { PropertyFilters, PropertySite } from '@/types'

interface PropertyFilterProps {
  onFiltersChange: (filters: PropertyFilters) => void
  onScrapeData: (city: string) => void
  isLoading: boolean
}

const PropertyFilter = ({ onFiltersChange, onScrapeData, isLoading }: PropertyFilterProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const { register, handleSubmit, watch, reset } = useForm<PropertyFilters>({
    defaultValues: {
      city: 'krakow',
      sites: ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'],
      sortBy: 'price_asc'
    }
  })

  const watchedCity = watch('city')

  const onSubmit = (data: PropertyFilters) => {
    onFiltersChange(data)
  }

  const handleScrape = () => {
    onScrapeData(watchedCity || 'krakow')
  }

  const resetFilters = () => {
    reset()
    onFiltersChange({
      city: 'krakow',
      sites: ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'],
      sortBy: 'price_asc'
    })
  }

  const siteOptions: { value: PropertySite; label: string; color: string }[] = [
    { value: 'allegro', label: 'Allegro', color: 'bg-orange-500' },
    { value: 'gethome', label: 'GetHome', color: 'bg-green-500' },
    { value: 'nieruchomosci', label: 'Nieruchomości Online', color: 'bg-blue-500' },
    { value: 'olx', label: 'OLX', color: 'bg-purple-500' },
    { value: 'otodom', label: 'Otodom', color: 'bg-yellow-500' },
  ]

  return (
    <div className="filter-panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Filters
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {showAdvanced ? 'Simple' : 'Advanced'}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="filter-grid">
          <div className="form-group">
            <label className="form-label">City</label>
            <input
              {...register('city')}
              type="text"
              className="form-input"
              placeholder="Enter city name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sort By</label>
            <select {...register('sortBy')} className="form-input">
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {showAdvanced && (
            <>
              <div className="form-group">
                <label className="form-label">Min Price (PLN)</label>
                <input
                  {...register('priceMin', { valueAsNumber: true })}
                  type="number"
                  className="form-input"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Price (PLN)</label>
                <input
                  {...register('priceMax', { valueAsNumber: true })}
                  type="number"
                  className="form-input"
                  placeholder="10000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Min Area (m²)</label>
                <input
                  {...register('areaMin', { valueAsNumber: true })}
                  type="number"
                  className="form-input"
                  placeholder="20"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Area (m²)</label>
                <input
                  {...register('areaMax', { valueAsNumber: true })}
                  type="number"
                  className="form-input"
                  placeholder="200"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Min Rooms</label>
                <input
                  {...register('roomsMin', { valueAsNumber: true })}
                  type="number"
                  className="form-input"
                  placeholder="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Rooms</label>
                <input
                  {...register('roomsMax', { valueAsNumber: true })}
                  type="number"
                  className="form-input"
                  placeholder="5"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address Contains</label>
                <input
                  {...register('address')}
                  type="text"
                  className="form-input"
                  placeholder="Enter address keyword"
                />
              </div>
            </>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Sources</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {siteOptions.map((site) => (
              <label key={site.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('sites')}
                  type="checkbox"
                  value={site.value}
                  className="rounded"
                />
                <span className={`px-3 py-1 rounded-full text-white text-sm ${site.color}`}>
                  {site.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" className="btn btn-primary flex-1">
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleScrape}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            {isLoading ? 'Scraping...' : 'Scrape New Data'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PropertyFilter
