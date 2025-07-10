import { ExternalLink, MapPin, Square, Users, Layers } from 'lucide-react'
import { Property } from '@/types'

interface PropertyCardProps {
  property: Property
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const getSiteBadgeClass = (site: string) => {
    const siteClasses = {
      allegro: 'site-allegro',
      gethome: 'site-gethome', 
      nieruchomosci: 'site-nieruchomosci',
      olx: 'site-olx',
      otodom: 'site-otodom'
    }
    return siteClasses[site as keyof typeof siteClasses] || 'bg-gray-500'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="property-card">
      <div className="relative">
        <img
          src={property.image || '/placeholder-image.jpg'}
          alt={property.title}
          className="property-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-image.jpg'
          }}
        />
        <div className="absolute top-3 left-3">
          <span className={`site-badge ${getSiteBadgeClass(property.site)}`}>
            {property.site.charAt(0).toUpperCase() + property.site.slice(1)}
          </span>
        </div>
      </div>

      <div className="property-content">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {property.title}
        </h3>

        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <MapPin className="h-4 w-4" />
          <span className="text-sm line-clamp-1">{property.address}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Square className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{property.area} m²</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{property.rooms} rooms</span>
          </div>

          {property.level !== undefined && (
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Floor {property.level}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">
            {formatPrice(property.price)}
          </div>
          
          <a
            href={property.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View
          </a>
        </div>
      </div>
    </div>
  )
}

export default PropertyCard
