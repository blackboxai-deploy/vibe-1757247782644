// Local storage utilities for NATPAC Travel Data Collection App

import { 
  Trip, 
  Traveler, 
  User, 
  ConsentData, 
  AppSettings, 
  LocalStorageData 
} from './types';

export class StorageService {
  private static instance: StorageService;
  private readonly STORAGE_PREFIX = 'natpac_travel_';
  private readonly STORAGE_KEYS = {
    USER: 'user',
    TRIPS: 'trips',
    TRAVELERS: 'travelers',
    SETTINGS: 'settings',
    CONSENT: 'consent',
    LAST_SYNC: 'last_sync'
  };

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private getStorageKey(key: string): string {
    return `${this.STORAGE_PREFIX}${key}`;
  }

  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private setItem(key: string, value: any): boolean {
    if (!this.isStorageAvailable()) return false;
    
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.getStorageKey(key), serialized);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isStorageAvailable()) return defaultValue;
    
    try {
      const item = localStorage.getItem(this.getStorageKey(key));
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  private removeItem(key: string): boolean {
    if (!this.isStorageAvailable()) return false;
    
    try {
      localStorage.removeItem(this.getStorageKey(key));
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  // User management
  saveUser(user: User): boolean {
    return this.setItem(this.STORAGE_KEYS.USER, user);
  }

  getUser(): User | null {
    return this.getItem<User | null>(this.STORAGE_KEYS.USER, null);
  }

  removeUser(): boolean {
    return this.removeItem(this.STORAGE_KEYS.USER);
  }

  // Trip management
  saveTrips(trips: Trip[]): boolean {
    return this.setItem(this.STORAGE_KEYS.TRIPS, trips);
  }

  getTrips(): Trip[] {
    return this.getItem<Trip[]>(this.STORAGE_KEYS.TRIPS, []);
  }

  addTrip(trip: Trip): boolean {
    const trips = this.getTrips();
    trips.push(trip);
    return this.saveTrips(trips);
  }

  updateTrip(tripId: string, updates: Partial<Trip>): boolean {
    const trips = this.getTrips();
    const index = trips.findIndex(trip => trip.id === tripId);
    
    if (index === -1) return false;
    
    trips[index] = { ...trips[index], ...updates, updatedAt: new Date() };
    return this.saveTrips(trips);
  }

  deleteTrip(tripId: string): boolean {
    const trips = this.getTrips();
    const filteredTrips = trips.filter(trip => trip.id !== tripId);
    return this.saveTrips(filteredTrips);
  }

  getTripById(tripId: string): Trip | null {
    const trips = this.getTrips();
    return trips.find(trip => trip.id === tripId) || null;
  }

  getActiveTrip(): Trip | null {
    const trips = this.getTrips();
    return trips.find(trip => trip.status === 'active') || null;
  }

  // Traveler management
  saveTravelers(travelers: Traveler[]): boolean {
    return this.setItem(this.STORAGE_KEYS.TRAVELERS, travelers);
  }

  getTravelers(): Traveler[] {
    return this.getItem<Traveler[]>(this.STORAGE_KEYS.TRAVELERS, []);
  }

  addTraveler(traveler: Traveler): boolean {
    const travelers = this.getTravelers();
    travelers.push(traveler);
    return this.saveTravelers(travelers);
  }

  updateTraveler(travelerId: string, updates: Partial<Traveler>): boolean {
    const travelers = this.getTravelers();
    const index = travelers.findIndex(traveler => traveler.id === travelerId);
    
    if (index === -1) return false;
    
    travelers[index] = { ...travelers[index], ...updates };
    return this.saveTravelers(travelers);
  }

  deleteTraveler(travelerId: string): boolean {
    const travelers = this.getTravelers();
    const filteredTravelers = travelers.filter(traveler => traveler.id !== travelerId);
    return this.saveTravelers(filteredTravelers);
  }

  getTravelerById(travelerId: string): Traveler | null {
    const travelers = this.getTravelers();
    return travelers.find(traveler => traveler.id === travelerId) || null;
  }

  // Settings management
  saveSettings(settings: AppSettings): boolean {
    return this.setItem(this.STORAGE_KEYS.SETTINGS, settings);
  }

  getSettings(): AppSettings {
    return this.getItem<AppSettings>(this.STORAGE_KEYS.SETTINGS, {
      autoDetectLocation: true,
      backgroundTracking: false,
      notificationsEnabled: true,
      dataRetentionDays: 365,
      syncFrequency: 'weekly',
      theme: 'system'
    });
  }

  updateSettings(updates: Partial<AppSettings>): boolean {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    return this.saveSettings(newSettings);
  }

  // Consent management
  saveConsent(consent: ConsentData): boolean {
    return this.setItem(this.STORAGE_KEYS.CONSENT, consent);
  }

  getConsent(): ConsentData | null {
    return this.getItem<ConsentData | null>(this.STORAGE_KEYS.CONSENT, null);
  }

  removeConsent(): boolean {
    return this.removeItem(this.STORAGE_KEYS.CONSENT);
  }

  // Sync management
  setLastSync(date: Date): boolean {
    return this.setItem(this.STORAGE_KEYS.LAST_SYNC, date);
  }

  getLastSync(): Date | null {
    return this.getItem<Date | null>(this.STORAGE_KEYS.LAST_SYNC, null);
  }

  // Data export/import
  exportAllData(): LocalStorageData {
    return {
      user: this.getUser() || undefined,
      trips: this.getTrips(),
      travelers: this.getTravelers(),
      settings: this.getSettings(),
      consent: this.getConsent() || undefined,
      lastSync: this.getLastSync() || undefined
    };
  }

  importAllData(data: LocalStorageData): boolean {
    try {
      if (data.user) this.saveUser(data.user);
      if (data.trips) this.saveTrips(data.trips);
      if (data.travelers) this.saveTravelers(data.travelers);
      if (data.settings) this.saveSettings(data.settings);
      if (data.consent) this.saveConsent(data.consent);
      if (data.lastSync) this.setLastSync(data.lastSync);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): boolean {
    try {
      const keys = Object.values(this.STORAGE_KEYS);
      keys.forEach(key => this.removeItem(key));
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Get storage usage info
  getStorageInfo(): { used: number; total: number; percentage: number } {
    if (!this.isStorageAvailable()) {
      return { used: 0, total: 0, percentage: 0 };
    }

    try {
      let used = 0;
      for (let key in localStorage) {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Estimate total storage (5MB is typical for localStorage)
      const total = 5 * 1024 * 1024; // 5MB in bytes
      const percentage = (used / total) * 100;

      return { used, total, percentage };
    } catch (error) {
      console.error('Error calculating storage info:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }
}

// Singleton instance
export const storageService = StorageService.getInstance();

// Utility functions for common operations
export const saveTrip = (trip: Trip) => storageService.addTrip(trip);
export const getTrips = () => storageService.getTrips();
export const updateTrip = (id: string, updates: Partial<Trip>) => storageService.updateTrip(id, updates);
export const getActiveTrip = () => storageService.getActiveTrip();

export const saveTraveler = (traveler: Traveler) => storageService.addTraveler(traveler);
export const getTravelers = () => storageService.getTravelers();
export const updateTraveler = (id: string, updates: Partial<Traveler>) => storageService.updateTraveler(id, updates);

export const saveUser = (user: User) => storageService.saveUser(user);
export const getUser = () => storageService.getUser();

export const saveConsent = (consent: ConsentData) => storageService.saveConsent(consent);
export const getConsent = () => storageService.getConsent();

export const getSettings = () => storageService.getSettings();
export const updateSettings = (updates: Partial<AppSettings>) => storageService.updateSettings(updates);