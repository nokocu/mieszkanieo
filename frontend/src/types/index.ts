export interface Property {
  id: string;
  title: string;
  price: number;
  area: number;
  rooms: number;
  level?: number;
  address: string;
  image: string;
  link: string;
  site: PropertySite;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PropertySite = 'allegro' | 'gethome' | 'nieruchomosci' | 'olx' | 'otodom';

export interface PropertyFilters {
  sites: PropertySite[];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  roomsMin?: number;
  roomsMax?: number;
  levelMin?: number;
  levelMax?: number;
  address?: string;
  sortBy: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
}

export interface ScrapingJob {
  id: string;
  city: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  totalFound: number;
  error?: string;
}

export interface ScrapingResponse {
  jobId: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
