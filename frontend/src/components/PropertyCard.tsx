import React from 'react'
import { Property } from '../types'

interface PropertyCardProps {
  property: Property
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const getSiteInfo = (site: string) => {
    switch (site.toLowerCase()) {
      case 'allegro':
        return { logo: '/logo_a.png', class: 'text-a' }
      case 'gethome':
        return { logo: '/logo_g.png', class: 'text-g' }
      case 'olx':
        return { logo: '/logo_o.png', class: 'text-o' }
      case 'nieruchomosci':
        return { logo: '/logo_n.png', class: 'text-n' }
      case 'otodom':
        return { logo: '/logo_ot.png', class: 'text-ot' }
      default:
        return { logo: '/logo_o.png', class: 'text-o' }
    }
  }

  const siteInfo = getSiteInfo(property.site)

  return (
    <div className="col">
      <div className="card shadow-sm">
        <a href={property.link} target="_blank" rel="noopener noreferrer">
          <div className="card-head rounded" style={{backgroundImage: `url('${property.image}')`}}></div>
        </a>

        <div className="card-body">
          <div className="text-title pb-3">
            <img className="rounded-circle me-1" width="32" height="32" src={siteInfo.logo} alt={property.site} />
            <span className="d-inline-block text-truncate align-middle" style={{maxWidth: '17vw'}}>
              {property.title}
            </span>
          </div>

          <div className="pb-3">
            <span className={siteInfo.class}>{property.price} zł</span>
          </div>

          <div className="pb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi" viewBox="0 0 18 16">
              <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"></path>
            </svg>
            <small className="text-body-secondary d-inline-block text-truncate align-middle" style={{maxWidth: '19vw'}}>
              {property.address ? `Lokalizacja: ${property.address}` : 'Lokalizacja: -'}
            </small>
          </div>

          <div>
            {property.rooms && (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi" viewBox="0 0 16 16">
                  <path d="M12 1a1 1 0 0 1 1 1v13h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V2a1 1 0 0 1 1-1zm-2 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path>
                </svg>
                <small className="text-body-secondary pe-2">Pokoje: {property.rooms}</small>
              </>
            )}

            {property.area && (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi" viewBox="0 0 16 16">
                  <path d="M0 12.5v-9A1.5 1.5 0 0 1 1.5 2h13A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 12.5M2.5 4a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0V5h2.5a.5.5 0 0 0 0-1zm11 8a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-1 0V11h-2.5a.5.5 0 0 0 0 1z"></path>
                </svg>
                <small className="text-body-secondary pe-1">Powierzchnia: {property.area} m²</small>
              </>
            )}

            {property.level && (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi" viewBox="0 0 16 16">
                  <path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"></path>
                </svg>
                <small className="text-body-secondary">Poziom: {property.level}</small>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyCard
