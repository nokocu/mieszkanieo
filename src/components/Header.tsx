import React from 'react'
import { PropertyFilters } from '../types'

interface HeaderProps {
  isFilterExpanded: boolean
  isRefreshExpanded: boolean
  filters: PropertyFilters
  onFiltersChange: (filters: PropertyFilters) => void
  onFiltersToggle: () => void
  onRefreshToggle: () => void
  onScrapeClick: () => void
}

const Header: React.FC<HeaderProps> = ({ 
  isFilterExpanded,
  isRefreshExpanded,
  filters,
  onFiltersChange,
  onFiltersToggle,
  onRefreshToggle,
  onScrapeClick
}) => {
  const handleSiteToggle = (site: string) => {
    const currentSites = filters.sites || []
    const updatedSites = currentSites.includes(site as any)
      ? currentSites.filter(s => s !== site)
      : [...currentSites, site as any]
    
    console.log('Site toggle:', site)
    console.log('Current sites:', currentSites)
    console.log('Updated sites:', updatedSites)
    
    onFiltersChange({ ...filters, sites: updatedSites })
  }

  const handleFilterChange = (field: keyof PropertyFilters, value: any) => {
    onFiltersChange({ ...filters, [field]: value })
  }

  return (
    <nav className={`navbar navbar-expand-md navbar-dark fixed-top bg-body d-block shadow-lg ${isFilterExpanded || isRefreshExpanded ? 'expanded' : ''}`}>
      {/* Main navbar row */}
      <div className="container-fluid d-flex justify-content-center">
        <img className="logeo me-2" src="/logeo.png" height="52" alt="Logo" />

        <button 
          type="button" 
          className={`btn me-2 border-dark-subtle ${isFilterExpanded ? 'active' : ''}`}
          onClick={onFiltersToggle}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-funnel-fill" viewBox="0 0 16 16">
            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z"/>
          </svg>
        </button>

        <button 
          type="button" 
          className={`btn border me-2 border-dark-subtle ${isRefreshExpanded ? 'active' : ''}`}
          onClick={onRefreshToggle}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
          </svg>
        </button>
      </div>

      {/* Expanded Filter Panel */}
      {isFilterExpanded && (
        <div className="container-fluid mt-3 border-top pt-3 expanded-panel">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-bold">Serwisy</label>
                <div className="d-flex flex-wrap gap-2">
                  {['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'].map(site => (
                    <div key={site} className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id={`switch-${site}`}
                        checked={filters.sites?.includes(site as any) || false}
                        onChange={() => handleSiteToggle(site)}
                      />
                      <label className="form-check-label" htmlFor={`switch-${site}`}>
                        {site.charAt(0).toUpperCase() + site.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Sortowanie</label>
                <div className="d-flex flex-wrap gap-3">
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="radio" 
                      id="sortPriceAsc"
                      name="sortBy"
                      checked={filters.sortBy === 'price_asc'}
                      onChange={() => handleFilterChange('sortBy', 'price_asc')}
                    />
                    <label className="form-check-label" htmlFor="sortPriceAsc">
                      Od najtańszych
                    </label>
                  </div>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="radio" 
                      id="sortPriceDesc"
                      name="sortBy"
                      checked={filters.sortBy === 'price_desc'}
                      onChange={() => handleFilterChange('sortBy', 'price_desc')}
                    />
                    <label className="form-check-label" htmlFor="sortPriceDesc">
                      Od najdroższych
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label fw-bold">Cena</label>
                  <div className="d-flex">
                    <input 
                      className="form-control form-control-sm" 
                      placeholder="od"
                      type="number"
                      value={filters.priceMin || ''}
                      onChange={(e) => handleFilterChange('priceMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <span className="mx-2 align-self-center">—</span>
                    <input 
                      className="form-control form-control-sm" 
                      placeholder="do"
                      type="number"
                      value={filters.priceMax || ''}
                      onChange={(e) => handleFilterChange('priceMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <div className="col-6">
                  <label className="form-label fw-bold">Pokoje</label>
                  <div className="d-flex">
                    <input 
                      className="form-control form-control-sm" 
                      placeholder="od"
                      type="number"
                      value={filters.roomsMin || ''}
                      onChange={(e) => handleFilterChange('roomsMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <span className="mx-2 align-self-center">—</span>
                    <input 
                      className="form-control form-control-sm" 
                      placeholder="do"
                      type="number"
                      value={filters.roomsMax || ''}
                      onChange={(e) => handleFilterChange('roomsMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <div className="col-6">
                  <label className="form-label fw-bold">Powierzchnia</label>
                  <div className="d-flex">
                    <input 
                      className="form-control form-control-sm" 
                      placeholder="od"
                      type="number"
                      value={filters.areaMin || ''}
                      onChange={(e) => handleFilterChange('areaMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <span className="mx-2 align-self-center">—</span>
                    <input 
                      className="form-control form-control-sm" 
                      placeholder="do"
                      type="number"
                      value={filters.areaMax || ''}
                      onChange={(e) => handleFilterChange('areaMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <div className="col-6">
                  <label className="form-label fw-bold">Poziom</label>
                  <div className="d-flex">
                    <input 
                      className="form-control form-control-sm" 
                      placeholder="od"
                      type="number"
                      value={filters.levelMin || ''}
                      onChange={(e) => handleFilterChange('levelMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <span className="mx-2 align-self-center">—</span>
                    <input 
                      className="form-control form-control-sm" 
                      placeholder="do"
                      type="number"
                      value={filters.levelMax || ''}
                      onChange={(e) => handleFilterChange('levelMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-bold">Lokalizacja</label>
                  <input 
                    className="form-control form-control-sm" 
                    placeholder="Adres"
                    value={filters.address || ''}
                    onChange={(e) => handleFilterChange('address', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Refresh/Scraping Panel */}
      {isRefreshExpanded && (
        <div className="container-fluid mt-3 border-top pt-3 expanded-panel">
          <div className="row">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-3">
                <div>
                  <strong>Miasto do skanowania:</strong> Kraków
                </div>
                <div>
                  <strong>Ostatnie skanowanie:</strong> 
                  <span className="text-muted ms-1">Nigdy</span>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={onScrapeClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search me-1" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                </svg>
                Skanuj
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Header
