"use client";

import { useState, useEffect } from 'react';
import { Location } from '@/lib/types';
import { useLocationWithAddress } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatCoordinates } from '@/lib/geolocation';

interface LocationPickerProps {
  label: string;
  location: Location | null;
  onLocationChange: (location: Location) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}

export default function LocationPicker({
  label,
  location,
  onLocationChange,
  disabled = false,
  placeholder,
  required = false
}: LocationPickerProps) {
  const [manualAddress, setManualAddress] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const { 
    location: detectedLocation, 
    address: detectedAddress, 
    error: gpsError, 
    loading: gpsLoading,
    getLocationWithAddress 
  } = useLocationWithAddress();

  // Update location when GPS detects it
  useEffect(() => {
    if (detectedLocation && !isManualMode && !location) {
      onLocationChange(detectedLocation);
    }
  }, [detectedLocation, isManualMode, location, onLocationChange]);

  // Update manual address when location prop changes
  useEffect(() => {
    if (location && location.address && !isManualMode) {
      setManualAddress(location.address);
    }
  }, [location, isManualMode]);

  const handleGetCurrentLocation = async () => {
    setIsManualMode(false);
    await getLocationWithAddress();
  };

  const handleManualLocationSubmit = () => {
    if (!manualAddress.trim()) return;

    // Create a mock location for manual address
    // In production, you'd geocode the address to get coordinates
    const mockLocation: Location = {
      latitude: 8.5241 + (Math.random() - 0.5) * 0.1, // Mock coordinates around Kerala
      longitude: 76.9366 + (Math.random() - 0.5) * 0.1,
      address: manualAddress.trim(),
      timestamp: new Date()
    };

    onLocationChange(mockLocation);
    setIsManualMode(false);
  };

  const handleManualModeToggle = () => {
    setIsManualMode(!isManualMode);
    if (!isManualMode) {
      setManualAddress(location?.address || '');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-lg font-semibold text-gray-900">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualModeToggle}
          disabled={disabled}
          className="text-blue-600 hover:text-blue-700"
        >
          {isManualMode ? '📍 Use GPS' : '✏️ Manual'}
        </Button>
      </div>

      {!isManualMode ? (
        // GPS Mode
        <div className="space-y-3">
          <Button
            onClick={handleGetCurrentLocation}
            disabled={disabled || gpsLoading}
            className="w-full flex items-center justify-center space-x-2 py-3"
          >
            {gpsLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Getting location...</span>
              </>
            ) : (
              <>
                <span>📍</span>
                <span>Get Current Location</span>
              </>
            )}
          </Button>

          {gpsError && (
            <Card className="p-3 bg-red-50 border-red-200">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <p className="text-red-800 text-sm">{gpsError}</p>
              </div>
            </Card>
          )}

          {location && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-green-800 font-medium">Location captured</span>
                </div>
                
                {location.address && (
                  <p className="text-green-700 text-sm">{location.address}</p>
                )}
                
                <p className="text-green-600 text-xs">
                  Coordinates: {formatCoordinates(location)}
                </p>
                
                <p className="text-green-600 text-xs">
                  Time: {location.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </Card>
          )}
        </div>
      ) : (
        // Manual Mode
        <div className="space-y-3">
          <Input
            placeholder={placeholder || "Enter address or location name"}
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            disabled={disabled}
            className="w-full"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleManualLocationSubmit();
              }
            }}
          />
          
          <div className="flex space-x-2">
            <Button
              onClick={handleManualLocationSubmit}
              disabled={disabled || !manualAddress.trim()}
              className="flex-1"
            >
              Set Location
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsManualMode(false)}
              disabled={disabled}
            >
              Cancel
            </Button>
          </div>

          {location && location.address === manualAddress && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">📍</span>
                <span className="text-blue-800 text-sm">Manual location set</span>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Display detected location info for reference */}
      {detectedLocation && detectedAddress && !isManualMode && !location && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="space-y-1">
            <p className="text-blue-800 text-sm font-medium">Detected location:</p>
            <p className="text-blue-700 text-sm">{detectedAddress}</p>
          </div>
        </Card>
      )}
    </div>
  );
}