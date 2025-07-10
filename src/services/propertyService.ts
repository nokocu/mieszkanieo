import axios from 'axios'
import { Property, PropertyFilters, ScrapingResponse, ApiResponse } from '@/types'

const API_BASE_URL = 'http://localhost:8001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

export const propertyService = {
  async getProperties(filters: PropertyFilters): Promise<Property[]> {
    try {
      // Convert camelCase to snake_case for API
      const apiFilters = {
        city: filters.city,
        sites: filters.sites,
        price_min: filters.priceMin,
        price_max: filters.priceMax,
        area_min: filters.areaMin,
        area_max: filters.areaMax,
        rooms_min: filters.roomsMin,
        rooms_max: filters.roomsMax,
        level_min: filters.levelMin,
        level_max: filters.levelMax,
        address: filters.address,
        sort_by: filters.sortBy
      }

      const response = await api.get<Property[]>('/properties', {
        params: apiFilters,
      })
      
      return response.data
    } catch (error) {
      console.error('Error fetching properties:', error)
      throw error
    }
  },

  async scrapeCity(city: string): Promise<ScrapingResponse> {
    try {
      const response = await api.post<ApiResponse<ScrapingResponse>>('/scrape', {
        city: city.toLowerCase(),
      })
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to start scraping')
      }
      
      return response.data.data
    } catch (error) {
      console.error('Error starting scrape:', error)
      throw error
    }
  },

  async getScrapingStatus(jobId: string) {
    try {
      const response = await api.get(`/scrape/status/${jobId}`)
      return response.data
    } catch (error) {
      console.error('Error getting scraping status:', error)
      throw error
    }
  }
}
