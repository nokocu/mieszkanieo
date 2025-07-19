import axios from 'axios'
import { Property, PropertyFilters, ScrapingResponse, ApiResponse } from '../types'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

export const propertyService = {
  async getProperties(filters: PropertyFilters): Promise<Property[]> {
    try {
      // convert camelCase to snake_case for API
      const apiFilters: any = {
        sort_by: filters.sortBy
      }

      // only add parameters that have values, except for sites which we always want to send
      if (filters.sites !== undefined) {
        apiFilters.sites = filters.sites.length > 0 ? filters.sites : [''] // Send empty string if no sites
      }
      
      if (filters.priceMin !== undefined) apiFilters.price_min = filters.priceMin
      if (filters.priceMax !== undefined) apiFilters.price_max = filters.priceMax
      if (filters.areaMin !== undefined) apiFilters.area_min = filters.areaMin
      if (filters.areaMax !== undefined) apiFilters.area_max = filters.areaMax
      if (filters.roomsMin !== undefined) apiFilters.rooms_min = filters.roomsMin
      if (filters.roomsMax !== undefined) apiFilters.rooms_max = filters.roomsMax
      if (filters.levelMin !== undefined) apiFilters.level_min = filters.levelMin
      if (filters.levelMax !== undefined) apiFilters.level_max = filters.levelMax
      if (filters.address !== undefined && filters.address !== '') apiFilters.address = filters.address

      const response = await api.get<Property[]>('/properties', {
        params: apiFilters,
        paramsSerializer: {
          indexes: null
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error fetching properties:', error)
      throw error
    }
  }
}
