import React from 'react'
import { PropertyFilters } from '../types'

interface PropertyFilterProps {
  isOpen: boolean
  onClose: () => void
  filters: PropertyFilters
  onFiltersChange: (filters: PropertyFilters) => void
  onApplyFilters: () => void
}

const PropertyFilter: React.FC<PropertyFilterProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters
}) => {
  if (!isOpen) return null

  const handleChange = (field: keyof PropertyFilters, value: any) => {
    onFiltersChange({ ...filters, [field]: value })
  }

  const handleApply = () => {
    onApplyFilters()
    onClose()
  }

  return (
    <>
      <div className={`modal mt-4 ${isOpen ? 'd-block' : ''}`} id="modalFilters" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-body p-4">

              <div className="mb-3">
                Sortuj
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    id="sortMin"
                    checked={filters.sortBy === 'price_asc'}
                    onChange={() => handleChange('sortBy', 'price_asc')}
                  />
                  <label className="form-check-label" htmlFor="sortMin">
                    Od najtańszych
                  </label>
                </div>
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    id="sortMax"
                    checked={filters.sortBy === 'price_desc'}
                    onChange={() => handleChange('sortBy', 'price_desc')}
                  />
                  <label className="form-check-label" htmlFor="sortMax">
                    Od najdroższych
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="switchA" defaultChecked />
                  <label className="form-check-label" htmlFor="switchA">Allegro</label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="switchG" defaultChecked />
                  <label className="form-check-label" htmlFor="switchG">Gethome</label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="switchN" defaultChecked />
                  <label className="form-check-label" htmlFor="switchN">Nieruchomości-Online</label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="switchO" defaultChecked />
                  <label className="form-check-label" htmlFor="switchO">Olx</label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="switchOt" defaultChecked />
                  <label className="form-check-label" htmlFor="switchOt">Otodom</label>
                </div>
              </div>

              <div className="mb-3">
                Cena
                <div className="d-flex mt-1">
                  <input 
                    className="form-control" 
                    placeholder="od"
                    type="number"
                    value={filters.priceMin || ''}
                    onChange={(e) => handleChange('priceMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                  <span className="ms-4 me-4">—</span>
                  <input 
                    className="form-control" 
                    placeholder="do"
                    type="number"
                    value={filters.priceMax || ''}
                    onChange={(e) => handleChange('priceMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>

                Poziom
                <div className="d-flex mt-1">
                  <input 
                    className="form-control" 
                    placeholder="od"
                    type="number"
                    value={filters.levelMin || ''}
                    onChange={(e) => handleChange('levelMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                  <span className="ms-4 me-4">—</span>
                  <input 
                    className="form-control" 
                    placeholder="do"
                    type="number"
                    value={filters.levelMax || ''}
                    onChange={(e) => handleChange('levelMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>

                Powierzchnia
                <div className="d-flex mt-1">
                  <input 
                    className="form-control" 
                    placeholder="od"
                    type="number"
                    value={filters.areaMin || ''}
                    onChange={(e) => handleChange('areaMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                  <span className="ms-4 me-4">—</span>
                  <input 
                    className="form-control" 
                    placeholder="do"
                    type="number"
                    value={filters.areaMax || ''}
                    onChange={(e) => handleChange('areaMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>

                Pokoje
                <div className="d-flex mt-1">
                  <input 
                    className="form-control" 
                    placeholder="od"
                    type="number"
                    value={filters.roomsMin || ''}
                    onChange={(e) => handleChange('roomsMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                  <span className="ms-4 me-4">—</span>
                  <input 
                    className="form-control" 
                    placeholder="do"
                    type="number"
                    value={filters.roomsMax || ''}
                    onChange={(e) => handleChange('roomsMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="d-flex">
                <input 
                  className="form-control border-dark-subtle" 
                  placeholder="Lokalizacja"
                  value={filters.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>

            </div>

            <div className="modal-footer mt-1" style={{borderTop: 'none'}}>
              <button type="button" className="btn" onClick={onClose}>Anuluj</button>
              <button type="button" className="btn btn-primary" onClick={handleApply}>Wybierz</button>
            </div>
          </div>
        </div>
      </div>
      {isOpen && <div className="modal-backdrop fade show" onClick={onClose}></div>}
    </>
  )
}

export default PropertyFilter
