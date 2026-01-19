/**
 * API Response Types
 * Shared types for API endpoints
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export interface HotelProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  status: string;
  activatedAt: string;
}

export interface Hotel {
  id: string;
  hotelName: string;
  hotelIdInPms: string;
  propertyCode?: string | null;
  city?: string | null;
  country?: string | null;
  isActive: boolean;
  syncEnabled: boolean;
  lastSyncAt?: string | null;
  createdAt: string;
}

export interface HotelProductsResponse {
  organizationId: string;
  hotelId: string;
  hotelName: string;
  products: HotelProduct[];
}

export interface OrganizationHotelsResponse {
  organizationId: string;
  organizationName: string;
  totalHotels: number;
  hotels: Hotel[];
}
