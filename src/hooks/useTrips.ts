"use client";

import { useState, useEffect, useCallback } from 'react';
import { Trip, TripStatus, NewTripForm, TripUpdateForm, Location } from '@/lib/types';
import { storageService } from '@/lib/storage';

interface UseTripsReturn {
  trips: Trip[];
  activeTrip: Trip | null;
  loading: boolean;
  error: string | null;
  createTrip: (tripData: NewTripForm & { origin: Location }) => Promise<string | null>;
  updateTrip: (tripId: string, updates: TripUpdateForm) => Promise<boolean>;
  completeTrip: (tripId: string, destination: Location, rating?: number) => Promise<boolean>;
  cancelTrip: (tripId: string) => Promise<boolean>;
  deleteTrip: (tripId: string) => Promise<boolean>;
  refreshTrips: () => void;
  getTripById: (tripId: string) => Trip | null;
  getRecentTrips: (limit?: number) => Trip[];
  getTripStats: () => { total: number; completed: number; active: number; avgDuration: number };
}

export function useTrips(): UseTripsReturn {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load trips from storage
  const loadTrips = useCallback(() => {
    try {
      const storedTrips = storageService.getTrips();
      setTrips(storedTrips);
      
      const active = storedTrips.find(trip => trip.status === 'active') || null;
      setActiveTrip(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    }
  }, []);

  // Load trips on mount
  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // Generate unique trip number
  const generateTripNumber = useCallback(() => {
    const existingNumbers = trips.map(trip => trip.tripNumber);
    return existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  }, [trips]);

  // Create new trip
  const createTrip = useCallback(async (tripData: NewTripForm & { origin: Location }): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      // Check if there's already an active trip
      if (activeTrip) {
        setError('Please complete or cancel the current active trip before starting a new one');
        setLoading(false);
        return null;
      }

      const tripId = `trip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date();

      const newTrip: Trip = {
        id: tripId,
        tripNumber: generateTripNumber(),
        status: 'active',
        origin: tripData.origin,
        startTime: now,
        mode: tripData.mode,
        purpose: tripData.purpose,
        purposeDetail: tripData.purposeDetail,
        primaryTraveler: 'current_user', // Would be actual user ID in production
        accompanyingTravelers: tripData.accompanyingTravelers,
        totalTravelers: 1 + tripData.accompanyingTravelers.length,
        notes: tripData.notes,
        createdAt: now,
        updatedAt: now
      };

      const success = storageService.addTrip(newTrip);
      
      if (success) {
        setTrips(prev => [...prev, newTrip]);
        setActiveTrip(newTrip);
        return tripId;
      } else {
        setError('Failed to save trip');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeTrip, generateTripNumber]);

  // Update trip
  const updateTrip = useCallback(async (tripId: string, updates: TripUpdateForm): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const success = storageService.updateTrip(tripId, updates);
      
      if (success) {
        setTrips(prev => 
          prev.map(trip => 
            trip.id === tripId 
              ? { ...trip, ...updates, updatedAt: new Date() }
              : trip
          )
        );

        // Update active trip if it's the one being updated
        if (activeTrip && activeTrip.id === tripId) {
          setActiveTrip(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
        }

        return true;
      } else {
        setError('Failed to update trip');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trip');
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeTrip]);

  // Complete trip
  const completeTrip = useCallback(async (tripId: string, destination: Location, rating?: number): Promise<boolean> => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) {
      setError('Trip not found');
      return false;
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - trip.startTime.getTime()) / (1000 * 60)); // duration in minutes

    const updates: Partial<Trip> = {
      status: 'completed' as TripStatus,
      destination,
      endTime,
      duration,
      satisfactionRating: rating
    };

    const success = await updateTrip(tripId, updates);
    
    if (success && activeTrip && activeTrip.id === tripId) {
      setActiveTrip(null);
    }

    return success;
  }, [trips, activeTrip, updateTrip]);

  // Cancel trip
  const cancelTrip = useCallback(async (tripId: string): Promise<boolean> => {
    const updates: Partial<Trip> = {
      status: 'cancelled' as TripStatus,
      endTime: new Date()
    };

    const success = await updateTrip(tripId, updates);
    
    if (success && activeTrip && activeTrip.id === tripId) {
      setActiveTrip(null);
    }

    return success;
  }, [activeTrip, updateTrip]);

  // Delete trip
  const deleteTrip = useCallback(async (tripId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const success = storageService.deleteTrip(tripId);
      
      if (success) {
        setTrips(prev => prev.filter(trip => trip.id !== tripId));
        
        if (activeTrip && activeTrip.id === tripId) {
          setActiveTrip(null);
        }

        return true;
      } else {
        setError('Failed to delete trip');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trip');
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeTrip]);

  // Refresh trips
  const refreshTrips = useCallback(() => {
    loadTrips();
  }, [loadTrips]);

  // Get trip by ID
  const getTripById = useCallback((tripId: string): Trip | null => {
    return trips.find(trip => trip.id === tripId) || null;
  }, [trips]);

  // Get recent trips
  const getRecentTrips = useCallback((limit: number = 5): Trip[] => {
    return [...trips]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [trips]);

  // Get trip statistics
  const getTripStats = useCallback(() => {
    const total = trips.length;
    const completed = trips.filter(trip => trip.status === 'completed').length;
    const active = trips.filter(trip => trip.status === 'active').length;
    
    const completedTrips = trips.filter(trip => trip.status === 'completed' && trip.duration);
    const avgDuration = completedTrips.length > 0 
      ? Math.round(completedTrips.reduce((sum, trip) => sum + (trip.duration || 0), 0) / completedTrips.length)
      : 0;

    return { total, completed, active, avgDuration };
  }, [trips]);

  return {
    trips,
    activeTrip,
    loading,
    error,
    createTrip,
    updateTrip,
    completeTrip,
    cancelTrip,
    deleteTrip,
    refreshTrips,
    getTripById,
    getRecentTrips,
    getTripStats
  };
}

// Hook for trip history with filtering and pagination
export function useTripHistory(pageSize: number = 10) {
  const { trips } = useTrips();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<{
    status?: TripStatus;
    purpose?: string;
    mode?: string;
    dateRange?: { start: Date; end: Date };
  }>({});

  const filteredTrips = trips.filter(trip => {
    if (filter.status && trip.status !== filter.status) return false;
    if (filter.purpose && trip.purpose !== filter.purpose) return false;
    if (filter.mode && trip.mode !== filter.mode) return false;
    if (filter.dateRange) {
      const tripDate = new Date(trip.startTime);
      if (tripDate < filter.dateRange.start || tripDate > filter.dateRange.end) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const totalPages = Math.ceil(filteredTrips.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTrips = filteredTrips.slice(startIndex, startIndex + pageSize);

  return {
    trips: paginatedTrips,
    allTrips: filteredTrips,
    currentPage,
    totalPages,
    totalTrips: filteredTrips.length,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    setCurrentPage,
    setFilter,
    filter,
    nextPage: () => setCurrentPage(prev => Math.min(prev + 1, totalPages)),
    prevPage: () => setCurrentPage(prev => Math.max(prev - 1, 1))
  };
}