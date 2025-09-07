// Geolocation utilities for NATPAC Travel Data Collection App

import { Location, GeolocationResult, AddressResult } from './types';

export class GeolocationService {
  private static instance: GeolocationService;
  private watchId: number | null = null;

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Check if geolocation is supported and permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    if (!navigator.geolocation) {
      return false;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state === 'granted' || permission.state === 'prompt';
    } catch (error) {
      console.warn('Permission API not supported:', error);
      return true; // Fallback to trying geolocation directly
    }
  }

  /**
   * Get current position with high accuracy
   */
  async getCurrentLocation(): Promise<GeolocationResult> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          success: false,
          error: 'Geolocation is not supported by this browser'
        });
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // 30 seconds
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date()
          };
          resolve({
            success: true,
            location
          });
        },
        (error) => {
          let errorMessage = 'Unknown geolocation error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          resolve({
            success: false,
            error: errorMessage
          });
        },
        options
      );
    });
  }

  /**
   * Start watching position for continuous tracking
   */
  startWatching(callback: (location: Location) => void, errorCallback?: (error: string) => void): boolean {
    if (!navigator.geolocation) {
      errorCallback?.('Geolocation not supported');
      return false;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 10000 // 10 seconds
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date()
        };
        callback(location);
      },
      (error) => {
        let errorMessage = 'Watch position error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location timeout';
            break;
        }
        errorCallback?.(errorMessage);
      },
      options
    );

    return true;
  }

  /**
   * Stop watching position
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two locations (Haversine formula)
   */
  static calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(loc2.latitude - loc1.latitude);
    const dLon = this.toRad(loc2.longitude - loc1.longitude);
    const lat1 = this.toRad(loc1.latitude);
    const lat2 = this.toRad(loc2.latitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;

    return d;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Reverse geocoding - convert coordinates to address
   * Note: This is a placeholder for demonstration. In production, you'd use a real geocoding service
   */
  async reverseGeocode(location: Location): Promise<AddressResult | null> {
    try {
      // Placeholder implementation - in production use Google Maps API, OpenStreetMap, etc.
      const mockAddresses = [
        'Thiruvananthapuram, Kerala, India',
        'Kochi, Kerala, India',
        'Kozhikode, Kerala, India',
        'Thrissur, Kerala, India',
        'Kollam, Kerala, India'
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const randomAddress = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
      
      return {
        formatted_address: `${randomAddress} (${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)})`,
        place_id: `mock_${Date.now()}`,
        types: ['route', 'political']
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Format coordinates for display
   */
  static formatCoordinates(location: Location): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  /**
   * Check if location is within India (approximate bounds)
   */
  static isWithinIndia(location: Location): boolean {
    const { latitude, longitude } = location;
    // Approximate bounds for India
    return latitude >= 6.0 && latitude <= 37.0 && longitude >= 68.0 && longitude <= 97.5;
  }
}

// Utility functions
export const geolocationService = GeolocationService.getInstance();

export const getCurrentLocation = () => geolocationService.getCurrentLocation();

export const startLocationTracking = (callback: (location: Location) => void, errorCallback?: (error: string) => void) => 
  geolocationService.startWatching(callback, errorCallback);

export const stopLocationTracking = () => geolocationService.stopWatching();

export const calculateDistance = GeolocationService.calculateDistance;

export const formatCoordinates = GeolocationService.formatCoordinates;