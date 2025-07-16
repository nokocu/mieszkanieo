import React from 'react'
import { Property } from '../types'

interface PropertyCardProps {
  property: Property
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const getSiteInfo = (site: string) => {
    switch (site.toLowerCase()) {
      case 'allegro':
        return { logo: '/logo_a.png', color: 'text-orange-600' }
      case 'gethome':
        return { logo: '/logo_g.png', color: 'text-green-600' }
      case 'olx':
        return { logo: '/logo_o.png', color: 'text-green-600' }
      case 'nieruchomosci':
        return { logo: '/logo_n.png', color: 'text-purple-600' }
      case 'otodom':
        return { logo: '/logo_ot.png', color: 'text-red-600' }
      default:
        return { logo: '/logo_o.png', color: 'text-green-600' }
    }
  }

  const siteInfo = getSiteInfo(property.site)

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <a href={property.link} target="_blank" rel="noopener noreferrer" className="block">
        <div 
          className="h-48 bg-cover bg-center bg-neutral-200 dark:bg-neutral-700"
          style={{backgroundImage: `url('${property.image}')`}}
        >
          {!property.image && (
            <div className="h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </a>

      <div className="p-4">
        <div className="flex items-center mb-3">
          <img className="w-8 h-8 rounded mr-2" src={siteInfo.logo} alt={property.site} />
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {property.title}
          </span>
        </div>

        <div className="mb-3">
          <span className={`text-xl font-bold ${siteInfo.color}`}>
            {property.price.toLocaleString()} zł
          </span>
        </div>

        <div className="mb-3 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 18 16">
            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"></path>
          </svg>
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {property.address || 'Lokalizacja: -'}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
          {property.rooms && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12 1a1 1 0 0 1 1 1v13h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V2a1 1 0 0 1 1-1zm-2 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path>
              </svg>
              <span>{property.rooms} pokoje</span>
            </div>
          )}

          {property.area && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 12.5v-9A1.5 1.5 0 0 1 1.5 2h13A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 12.5M2.5 4a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0V5h2.5a.5.5 0 0 0 0-1zm11 8a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-1 0V11h-2.5a.5.5 0 0 0 0 1z"></path>
              </svg>
              <span>{property.area} m²</span>
            </div>
          )}

          {property.level && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 16 16">
                <path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"></path>
              </svg>
              <span>Piętro {property.level}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertyCard
