// Core type definitions for NATPAC Travel Data Collection App

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: Date;
}

export interface Traveler {
  id: string;
  name: string;
  ageGroup: 'child' | 'teen' | 'adult' | 'senior';
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'friend' | 'colleague' | 'other';
  hasConsent: boolean;
  createdAt: Date;
}

export type TransportMode = 
  | 'walk'
  | 'bicycle'
  | 'motorcycle'
  | 'car'
  | 'bus'
  | 'train'
  | 'metro'
  | 'auto_rickshaw'
  | 'taxi'
  | 'shared_taxi'
  | 'other';

export type TripPurpose = 
  | 'work'
  | 'education'
  | 'shopping'
  | 'medical'
  | 'social'
  | 'leisure'
  | 'religious'
  | 'business'
  | 'return_home'
  | 'other';

export type TripStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface Trip {
  id: string;
  tripNumber: number;
  status: TripStatus;
  
  // Location data
  origin: Location;
  destination?: Location;
  waypoints?: Location[];
  
  // Time data
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  
  // Trip details
  mode: TransportMode;
  purpose: TripPurpose;
  purposeDetail?: string;
  
  // Travelers
  primaryTraveler: string; // user ID
  accompanyingTravelers: string[]; // traveler IDs
  totalTravelers: number;
  
  // Additional data
  satisfactionRating?: number; // 1-5 scale
  notes?: string;
  isPartOfChain?: boolean;
  chainId?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export interface TripChain {
  id: string;
  userId: string;
  tripIds: string[];
  startTime: Date;
  endTime?: Date;
  totalDistance?: number;
  totalDuration: number;
  primaryPurpose: TripPurpose;
  createdAt: Date;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  hasDataConsent: boolean;
  hasLocationConsent: boolean;
  consentDate?: Date;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface ConsentData {
  userId: string;
  dataCollection: boolean;
  locationTracking: boolean;
  dataSharing: boolean;
  researchParticipation: boolean;
  marketingCommunications: boolean;
  consentDate: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AppSettings {
  autoDetectLocation: boolean;
  backgroundTracking: boolean;
  notificationsEnabled: boolean;
  dataRetentionDays: number;
  syncFrequency: 'manual' | 'daily' | 'weekly';
  theme: 'light' | 'dark' | 'system';
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface NewTripForm {
  mode: TransportMode;
  purpose: TripPurpose;
  purposeDetail?: string;
  accompanyingTravelers: string[];
  notes?: string;
}

export interface TripUpdateForm {
  destination?: Location;
  mode?: TransportMode;
  purpose?: TripPurpose;
  purposeDetail?: string;
  satisfactionRating?: number;
  notes?: string;
}

export interface TravelerForm {
  name: string;
  ageGroup: Traveler['ageGroup'];
  relationship: Traveler['relationship'];
  hasConsent: boolean;
}

// Geolocation types
export interface GeolocationResult {
  success: boolean;
  location?: Location;
  error?: string;
}

export interface AddressResult {
  formatted_address: string;
  place_id?: string;
  types?: string[];
}

// Storage types
export interface LocalStorageData {
  user?: User;
  trips: Trip[];
  travelers: Traveler[];
  settings: AppSettings;
  consent?: ConsentData;
  lastSync?: Date;
}