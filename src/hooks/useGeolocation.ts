"use client";

import { useState, useEffect, useCallback } from 'react';
import { Location, GeolocationResult } from '@/lib/types';
import { geolocationService } from '@/lib/geolocation';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

interface UseGeolocationReturn {
  location: Location | null;
  error: string | null;
  loading: boolean;
  getCurrentLocation: () => Promise<void>;
  startWatching: () => void;
  stopWatching: () => void;
  clearError: () => void;
  hasPermission: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isWatching, setIsWatching] = useState<boolean>(false);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      const permission = await geolocationService.checkPermissions();
      setHasPermission(permission);
    };
    
    checkPermissions();
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result: GeolocationResult = await geolocationService.getCurrentLocation();
      
      if (result.success && result.location) {
        setLocation(result.location);
        setHasPermission(true);
      } else {
        setError(result.error || 'Failed to get location');
        if (result.error?.includes('denied')) {
          setHasPermission(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Start watching position
  const startWatching = useCallback(() => {
    if (isWatching) return;

    const success = geolocationService.startWatching(
      (newLocation: Location) => {
        setLocation(newLocation);
        setError(null);
        setHasPermission(true);
      },
      (watchError: string) => {
        setError(watchError);
        if (watchError.includes('denied')) {
          setHasPermission(false);
        }
      }
    );

    if (success) {
      setIsWatching(true);
    } else {
      setError('Failed to start location watching');
    }
  }, [isWatching]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (!isWatching) return;

    geolocationService.stopWatching();
    setIsWatching(false);
  }, [isWatching]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-start watching if enabled
  useEffect(() => {
    if (options.watch && hasPermission && !isWatching) {
      startWatching();
    }

    return () => {
      if (isWatching) {
        stopWatching();
      }
    };
  }, [options.watch, hasPermission, isWatching, startWatching, stopWatching]);

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    startWatching,
    stopWatching,
    clearError,
    hasPermission
  };
}

// Hook for getting location once with automatic retry
export function useLocationOnce(autoFetch: boolean = false) {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  const fetchLocation = useCallback(async (maxRetries: number = 3) => {
    if (attempts >= maxRetries) {
      setError('Max retry attempts reached');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await geolocationService.getCurrentLocation();
      
      if (result.success && result.location) {
        setLocation(result.location);
        setAttempts(0); // Reset attempts on success
      } else {
        setAttempts(prev => prev + 1);
        if (attempts + 1 < maxRetries) {
          // Retry after delay
          setTimeout(() => fetchLocation(maxRetries), 2000 * (attempts + 1));
          return;
        }
        setError(result.error || 'Failed to get location');
      }
    } catch (err) {
      setAttempts(prev => prev + 1);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (attempts + 1 < maxRetries) {
        setTimeout(() => fetchLocation(maxRetries), 2000 * (attempts + 1));
        return;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [attempts]);

  useEffect(() => {
    if (autoFetch && !location && !loading) {
      fetchLocation();
    }
  }, [autoFetch, location, loading, fetchLocation]);

  return {
    location,
    error,
    loading,
    fetchLocation,
    retry: () => {
      setAttempts(0);
      fetchLocation();
    }
  };
}

// Hook for location with address resolution
export function useLocationWithAddress() {
  const [location, setLocation] = useState<Location | null>(null);
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getLocationWithAddress = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await geolocationService.getCurrentLocation();
      
      if (result.success && result.location) {
        setLocation(result.location);
        
        // Try to get address
        try {
          const addressResult = await geolocationService.reverseGeocode(result.location);
          if (addressResult) {
            setAddress(addressResult.formatted_address);
            setLocation(prev => prev ? { ...prev, address: addressResult.formatted_address } : null);
          }
        } catch (addressError) {
          console.warn('Failed to get address:', addressError);
          // Location is still valid even if address fails
        }
      } else {
        setError(result.error || 'Failed to get location');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    location,
    address,
    error,
    loading,
    getLocationWithAddress
  };
}