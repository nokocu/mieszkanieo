import React from 'react'

interface HeaderProps {
  city: string
  onCityChange: (city: string) => void
  onFiltersClick: () => void
  onRefreshClick: () => void
}

const Header: React.FC<HeaderProps> = ({ 
  city, 
  onCityChange, 
  onFiltersClick, 
  onRefreshClick 
}) => {
  return (
    <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-body d-block shadow-lg">
      <div className="container-fluid d-flex justify-content-center">
        <img className="logeo me-2" src="/logeo.png" height="52" alt="Logo" />

        <div className="me-2">
          <input 
            name="inputCity" 
            className="form-control border-dark-subtle" 
            placeholder="Miasto"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
          />
        </div>

        <button 
          type="button" 
          className="btn me-2 border-dark-subtle" 
          onClick={onFiltersClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-funnel-fill" viewBox="0 0 16 16">
            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z"/>
          </svg>
        </button>

        <button 
          type="button" 
          className="btn border me-2 border-dark-subtle" 
          onClick={onRefreshClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
          </svg>
        </button>
      </div>
    </nav>
  )
}

export default Header
