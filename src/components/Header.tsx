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
    
    onFiltersChange({ ...filters, sites: updatedSites })
  }

  const handleFilterChange = (field: keyof PropertyFilters, value: any) => {
    onFiltersChange({ ...filters, [field]: value })
  }

  const toggleSortOrder = () => {
    const newSortBy = filters.sortBy === 'price_asc' ? 'price_desc' : 'price_asc'
    handleFilterChange('sortBy', newSortBy)
  }

  const getSiteIcon = (site: string) => {
    const icons: { [key: string]: string } = {
      allegro: '/logo_a.png',
      gethome: '/logo_g.png', 
      nieruchomosci: '/logo_n.png',
      olx: '/logo_o.png',
      otodom: '/logo_ot.png'
    }
    return icons[site] || '/logo_o.png'
  }

  const isSiteActive = (site: string) => {
    return filters.sites?.includes(site as any) || false
  }

  return (
    <nav className={`navbar navbar-expand-md navbar-dark fixed-top bg-body d-block shadow-lg ${isFilterExpanded || isRefreshExpanded ? 'expanded' : ''}`}>
      {/* Main navbar row */}
      <div className="container-fluid d-flex justify-content-center align-items-center">
        work in progress&nbsp;
        <img className="logeo me-3" src="/logeo.png" height="52" alt="Logo" />
        
        {/* Sort Toggle Button */}
        <button
          type="button"
          className={`btn btn-sm border me-2 border-dark-subtle  ${filters.sortBy === 'price_desc' ? 'active' : ''}`}
          onClick={toggleSortOrder}
          title={filters.sortBy === 'price_asc' ? 'Sortuj od najdroższych' : 'Sortuj od najtańszych'}
        >
          {filters.sortBy === 'price_asc' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-sort-numeric-up" viewBox="0 0 16 16">
              <path d="M12.438 1.668V7H11.39V2.684h-.051l-1.211.859v-.969l1.262-.906h1.046z"/>
              <path fillRule="evenodd" d="M11.36 14.098c-1.137 0-1.708-.657-1.762-1.278h1.004c.058.223.343.45.773.45.824 0 1.164-.829 1.133-1.856h-.059c-.148.39-.57.742-1.261.742-.91 0-1.72-.613-1.72-1.758 0-1.148.848-1.835 1.973-1.835 1.09 0 2.063.636 2.063 2.687 0 1.867-.723 2.848-2.145 2.848zm.062-2.735c.504 0 .933-.336.933-.972 0-.633-.398-1.008-.94-1.008-.52 0-.927.375-.927 1 0 .64.418.98.934.98z"/>
              <path d="M4.5 2.5a.5.5 0 0 0-1 0v9.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L4.5 12.293V2.5z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-sort-numeric-down" viewBox="0 0 16 16">
              <path d="M12.438 1.668V7H11.39V2.684h-.051l-1.211.859v-.969l1.262-.906h1.046z"/>
              <path fillRule="evenodd" d="M11.36 14.098c-1.137 0-1.708-.657-1.762-1.278h1.004c.058.223.343.45.773.45.824 0 1.164-.829 1.133-1.856h-.059c-.148.39-.57.742-1.261.742-.91 0-1.72-.613-1.72-1.758 0-1.148.848-1.835 1.973-1.835 1.09 0 2.063.636 2.063 2.687 0 1.867-.723 2.848-2.145 2.848zm.062-2.735c.504 0 .933-.336.933-.972 0-.633-.398-1.008-.94-1.008-.52 0-.927.375-.927 1 0 .64.418.98.934.98z"/>
              <path d="M4.5 13.5a.5.5 0 0 1-1 0V3.707L2.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.498.498 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L4.5 3.707V13.5z"/>
            </svg>
          )}
        </button>

        {/* Site Filter Buttons */}
        {/* {['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'].map(site => ( */}
        {['gethome', 'nieruchomosci', 'olx'].map(site => (
          <button
            key={site}
            type="button"
            className={`btn btn-sm border me-1 border-dark-subtle  ${isSiteActive(site) ? 'active' : 'inactive'}`}
            onClick={() => handleSiteToggle(site)}
            title={site.charAt(0).toUpperCase() + site.slice(1)}
          >
            <img 
              src={getSiteIcon(site)} 
              alt={site} 
              width="16" 
              height="16" 
              style={{ borderRadius: '4px' }}
            />
          </button>
        ))}

        <button 
          type="button" 
          className={`btn btn-sm me-2 border-dark-subtle ms-3 ${isFilterExpanded ? 'active' : ''}`}
          onClick={onFiltersToggle}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-funnel-fill" viewBox="0 0 16 16">
            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z"/>
          </svg>
        </button>

        <button 
          type="button" 
          className={`btn btn-sm border me-2 border-dark-subtle ${isRefreshExpanded ? 'active' : ''}`}
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
          <div className="d-flex align-items-center justify-content-center flex-wrap">
            
            {/* Price Filter */}
            <div className="input-group-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-currency-dollar filter-icon" viewBox="0 0 16 16">
                <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73l.348.086z"/>
              </svg>
              <input 
                className="form-control" 
                placeholder="od"
                type="number"
                value={filters.priceMin || ''}
                onChange={(e) => handleFilterChange('priceMin', e.target.value ? parseInt(e.target.value) : undefined)}
              />
              <input 
                className="form-control" 
                placeholder="do"
                type="number"
                value={filters.priceMax || ''}
                onChange={(e) => handleFilterChange('priceMax', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            {/* Rooms Filter */}
            <div className="input-group-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-door-closed filter-icon" viewBox="0 0 16 16">
                <path d="M3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V2zm1 13h8V2H4v13z"/>
                <path d="M9 9a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"/>
              </svg>
              <input 
                className="form-control" 
                placeholder="od"
                type="number"
                value={filters.roomsMin || ''}
                onChange={(e) => handleFilterChange('roomsMin', e.target.value ? parseInt(e.target.value) : undefined)}
              />
              <input 
                className="form-control" 
                placeholder="do"
                type="number"
                value={filters.roomsMax || ''}
                onChange={(e) => handleFilterChange('roomsMax', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            {/* Area Filter */}
            <div className="input-group-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-aspect-ratio filter-icon" viewBox="0 0 16 16">
                <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h13A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 12.5v-9zM1.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z"/>
                <path d="M2 4.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1H3v2.5a.5.5 0 0 1-1 0v-3zm12 7a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H13V8.5a.5.5 0 0 1 1 0v3z"/>
              </svg>
              <input 
                className="form-control" 
                placeholder="od"
                type="number"
                value={filters.areaMin || ''}
                onChange={(e) => handleFilterChange('areaMin', e.target.value ? parseInt(e.target.value) : undefined)}
              />
              <input 
                className="form-control" 
                placeholder="do"
                type="number"
                value={filters.areaMax || ''}
                onChange={(e) => handleFilterChange('areaMax', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            {/* Level Filter */}
            <div className="input-group-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-building filter-icon" viewBox="0 0 16 16">
                <path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1ZM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Z"/>
                <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1Zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3V1Z"/>
              </svg>
              <input 
                className="form-control" 
                placeholder="od"
                type="number"
                value={filters.levelMin || ''}
                onChange={(e) => handleFilterChange('levelMin', e.target.value ? parseInt(e.target.value) : undefined)}
              />
              <input 
                className="form-control" 
                placeholder="do"
                type="number"
                value={filters.levelMax || ''}
                onChange={(e) => handleFilterChange('levelMax', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            {/* Location Filter */}
            <div className="input-group-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-geo-alt filter-icon" viewBox="0 0 16 16">
                <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
                <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              </svg>
              <input 
                className="form-control" 
                placeholder="Lokalizacja"
                value={filters.address || ''}
                onChange={(e) => handleFilterChange('address', e.target.value)}
              />
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
