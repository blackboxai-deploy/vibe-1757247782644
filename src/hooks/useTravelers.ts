"use client";

import { useState, useEffect, useCallback } from 'react';
import { Traveler, TravelerForm } from '@/lib/types';
import { storageService } from '@/lib/storage';

interface UseTravelersReturn {
  travelers: Traveler[];
  loading: boolean;
  error: string | null;
  addTraveler: (travelerData: TravelerForm) => Promise<string | null>;
  updateTraveler: (travelerId: string, updates: Partial<TravelerForm>) => Promise<boolean>;
  deleteTraveler: (travelerId: string) => Promise<boolean>;
  getTravelerById: (travelerId: string) => Traveler | null;
  getConsentedTravelers: () => Traveler[];
  refreshTravelers: () => void;
  getTravelerStats: () => {
    total: number;
    withConsent: number;
    withoutConsent: number;
    byAgeGroup: Record<string, number>;
    byRelationship: Record<string, number>;
  };
}

export function useTravelers(): UseTravelersReturn {
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load travelers from storage
  const loadTravelers = useCallback(() => {
    try {
      const storedTravelers = storageService.getTravelers();
      setTravelers(storedTravelers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load travelers');
    }
  }, []);

  // Load travelers on mount
  useEffect(() => {
    loadTravelers();
  }, [loadTravelers]);

  // Add new traveler
  const addTraveler = useCallback(async (travelerData: TravelerForm): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      // Check if traveler with same name already exists
      const existingTraveler = travelers.find(
        t => t.name.toLowerCase() === travelerData.name.toLowerCase()
      );

      if (existingTraveler) {
        setError('A traveler with this name already exists');
        setLoading(false);
        return null;
      }

      const travelerId = `traveler_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date();

      const newTraveler: Traveler = {
        id: travelerId,
        name: travelerData.name.trim(),
        ageGroup: travelerData.ageGroup,
        relationship: travelerData.relationship,
        hasConsent: travelerData.hasConsent,
        createdAt: now
      };

      const success = storageService.addTraveler(newTraveler);
      
      if (success) {
        setTravelers(prev => [...prev, newTraveler]);
        return travelerId;
      } else {
        setError('Failed to save traveler');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add traveler');
      return null;
    } finally {
      setLoading(false);
    }
  }, [travelers]);

  // Update traveler
  const updateTraveler = useCallback(async (travelerId: string, updates: Partial<TravelerForm>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // If updating name, check for duplicates
      if (updates.name) {
        const existingTraveler = travelers.find(
          t => t.id !== travelerId && t.name.toLowerCase() === updates.name!.toLowerCase()
        );

        if (existingTraveler) {
          setError('A traveler with this name already exists');
          setLoading(false);
          return false;
        }
      }

      const success = storageService.updateTraveler(travelerId, updates);
      
      if (success) {
        setTravelers(prev => 
          prev.map(traveler => 
            traveler.id === travelerId 
              ? { ...traveler, ...updates }
              : traveler
          )
        );
        return true;
      } else {
        setError('Failed to update traveler');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update traveler');
      return false;
    } finally {
      setLoading(false);
    }
  }, [travelers]);

  // Delete traveler
  const deleteTraveler = useCallback(async (travelerId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const success = storageService.deleteTraveler(travelerId);
      
      if (success) {
        setTravelers(prev => prev.filter(traveler => traveler.id !== travelerId));
        return true;
      } else {
        setError('Failed to delete traveler');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete traveler');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get traveler by ID
  const getTravelerById = useCallback((travelerId: string): Traveler | null => {
    return travelers.find(traveler => traveler.id === travelerId) || null;
  }, [travelers]);

  // Get travelers with consent
  const getConsentedTravelers = useCallback((): Traveler[] => {
    return travelers.filter(traveler => traveler.hasConsent);
  }, [travelers]);

  // Refresh travelers
  const refreshTravelers = useCallback(() => {
    loadTravelers();
  }, [loadTravelers]);

  // Get traveler statistics
  const getTravelerStats = useCallback(() => {
    const total = travelers.length;
    const withConsent = travelers.filter(t => t.hasConsent).length;
    const withoutConsent = total - withConsent;

    // Group by age
    const byAgeGroup = travelers.reduce((acc, traveler) => {
      acc[traveler.ageGroup] = (acc[traveler.ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by relationship
    const byRelationship = travelers.reduce((acc, traveler) => {
      acc[traveler.relationship] = (acc[traveler.relationship] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      withConsent,
      withoutConsent,
      byAgeGroup,
      byRelationship
    };
  }, [travelers]);

  return {
    travelers,
    loading,
    error,
    addTraveler,
    updateTraveler,
    deleteTraveler,
    getTravelerById,
    getConsentedTravelers,
    refreshTravelers,
    getTravelerStats
  };
}

// Hook for traveler selection (for trip creation)
export function useTravelerSelection() {
  const { travelers, getConsentedTravelers } = useTravelers();
  const [selectedTravelers, setSelectedTravelers] = useState<string[]>([]);

  // Toggle traveler selection
  const toggleTraveler = useCallback((travelerId: string) => {
    setSelectedTravelers(prev => {
      if (prev.includes(travelerId)) {
        return prev.filter(id => id !== travelerId);
      } else {
        return [...prev, travelerId];
      }
    });
  }, []);

  // Select all consented travelers
  const selectAllConsented = useCallback(() => {
    const consentedIds = getConsentedTravelers().map(t => t.id);
    setSelectedTravelers(consentedIds);
  }, [getConsentedTravelers]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedTravelers([]);
  }, []);

  // Check if traveler is selected
  const isTravelerSelected = useCallback((travelerId: string): boolean => {
    return selectedTravelers.includes(travelerId);
  }, [selectedTravelers]);

  // Get selected traveler objects
  const getSelectedTravelers = useCallback((): Traveler[] => {
    return travelers.filter(traveler => selectedTravelers.includes(traveler.id));
  }, [travelers, selectedTravelers]);

  return {
    selectedTravelers,
    setSelectedTravelers,
    toggleTraveler,
    selectAllConsented,
    clearSelection,
    isTravelerSelected,
    getSelectedTravelers,
    availableTravelers: getConsentedTravelers(),
    selectedCount: selectedTravelers.length
  };
}

// Hook for managing traveler consent
export function useTravelerConsent() {
  const { travelers, updateTraveler } = useTravelers();
  const [pendingConsents, setPendingConsents] = useState<string[]>([]);

  // Grant consent for a traveler
  const grantConsent = useCallback(async (travelerId: string): Promise<boolean> => {
    setPendingConsents(prev => [...prev, travelerId]);
    
    const success = await updateTraveler(travelerId, { hasConsent: true });
    
    setPendingConsents(prev => prev.filter(id => id !== travelerId));
    
    return success;
  }, [updateTraveler]);

  // Revoke consent for a traveler
  const revokeConsent = useCallback(async (travelerId: string): Promise<boolean> => {
    setPendingConsents(prev => [...prev, travelerId]);
    
    const success = await updateTraveler(travelerId, { hasConsent: false });
    
    setPendingConsents(prev => prev.filter(id => id !== travelerId));
    
    return success;
  }, [updateTraveler]);

  // Get travelers by consent status
  const getTravelersByConsent = useCallback((hasConsent: boolean): Traveler[] => {
    return travelers.filter(traveler => traveler.hasConsent === hasConsent);
  }, [travelers]);

  // Check if consent action is pending
  const isConsentPending = useCallback((travelerId: string): boolean => {
    return pendingConsents.includes(travelerId);
  }, [pendingConsents]);

  return {
    grantConsent,
    revokeConsent,
    getTravelersByConsent,
    isConsentPending,
    consentedTravelers: getTravelersByConsent(true),
    unconsentedTravelers: getTravelersByConsent(false)
  };
}