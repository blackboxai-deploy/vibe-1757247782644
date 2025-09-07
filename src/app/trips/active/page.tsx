"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NavigationBar from '@/components/NavigationBar';
import LocationPicker from '@/components/LocationPicker';
import { useTrips } from '@/hooks/useTrips';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getModeIcon, getModeLabel } from '@/components/TripModeSelector';
import { Location, TripUpdateForm } from '@/lib/types';
import { formatCoordinates } from '@/lib/geolocation';

export default function ActiveTripPage() {
  const router = useRouter();
  const { activeTrip, updateTrip, completeTrip, cancelTrip, loading } = useTrips();
  const { location: currentLocation, startWatching, stopWatching } = useGeolocation({ watch: false });

  const [destination, setDestination] = useState<Location | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [tripDuration, setTripDuration] = useState<string>('0m');

  // Update trip duration every minute
  useEffect(() => {
    if (!activeTrip) return;

    const updateDuration = () => {
      const now = new Date();
      const start = new Date(activeTrip.startTime);
      const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
      
      if (diffMinutes < 60) {
        setTripDuration(`${diffMinutes}m`);
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        setTripDuration(`${hours}h ${minutes}m`);
      }
    };

    updateDuration();
    const timer = setInterval(updateDuration, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [activeTrip]);

  // Redirect if no active trip
  useEffect(() => {
    if (!activeTrip && !loading) {
      router.push('/');
    }
  }, [activeTrip, loading, router]);

  if (!activeTrip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading active trip...</p>
        </div>
      </div>
    );
  }

  const handleCompleteTrip = async () => {
    if (!destination) {
      alert('Please set the destination location');
      return;
    }

    setIsCompleting(true);
    
    try {
      const success = await completeTrip(activeTrip.id, destination, rating || undefined);
      
      if (success) {
        router.push('/trips/history');
      } else {
        alert('Failed to complete trip. Please try again.');
      }
    } catch (error) {
      console.error('Error completing trip:', error);
      alert('Failed to complete trip. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!confirm('Are you sure you want to cancel this trip? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await cancelTrip(activeTrip.id);
      
      if (success) {
        router.push('/');
      } else {
        alert('Failed to cancel trip. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling trip:', error);
      alert('Failed to cancel trip. Please try again.');
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    const updates: TripUpdateForm = { notes: notes.trim() || undefined };
    await updateTrip(activeTrip.id, updates);
  };

  const getPurposeIcon = (purpose: string) => {
    const icons: { [key: string]: string } = {
      work: '💼',
      education: '🎓',
      shopping: '🛒',
      medical: '🏥',
      social: '👥',
      leisure: '🎉',
      religious: '🕯️',
      business: '🤝',
      return_home: '🏠'
    };
    return icons[purpose] || '📍';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="animate-pulse">🟢</span>
              <h1 className="text-xl font-bold">Active Trip</h1>
            </div>
            <p className="text-green-100 text-sm">Trip #{activeTrip.tripNumber}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">{tripDuration}</div>
            <p className="text-green-100 text-xs">Duration</p>
          </div>
        </div>
      </div>

      {/* Trip Status Card */}
      <div className="p-4">
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-green-100 text-green-800">
                🟢 IN PROGRESS
              </Badge>
              <span className="text-sm text-green-600">
                Started: {new Date(activeTrip.startTime).toLocaleTimeString()}
              </span>
            </div>

            <div className="space-y-2">
              {/* Mode and Purpose */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getModeIcon(activeTrip.mode)}</span>
                  <span className="font-medium">{getModeLabel(activeTrip.mode)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{getPurposeIcon(activeTrip.purpose)}</span>
                  <span className="text-sm capitalize">
                    {activeTrip.purpose.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Origin */}
              <div className="flex items-start space-x-2">
                <span className="text-green-600 mt-0.5">🟢</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Origin</p>
                  <p className="text-sm text-gray-600 truncate">
                    {activeTrip.origin.address || formatCoordinates(activeTrip.origin)}
                  </p>
                </div>
              </div>

              {/* Travelers */}
              {activeTrip.totalTravelers > 1 && (
                <div className="flex items-center space-x-2">
                  <span>👥</span>
                  <span className="text-sm text-gray-600">
                    {activeTrip.totalTravelers} traveler{activeTrip.totalTravelers > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* Live Location Tracking */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Current Location</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={currentLocation ? stopWatching : startWatching}
              className="text-blue-600"
            >
              {currentLocation ? '⏸️ Stop Tracking' : '▶️ Start Tracking'}
            </Button>
          </div>
          
          {currentLocation ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="animate-pulse text-blue-600">📍</span>
                <span className="text-sm text-blue-800 font-medium">Location tracking active</span>
              </div>
              <p className="text-sm text-gray-600">
                {formatCoordinates(currentLocation)}
              </p>
              <p className="text-xs text-gray-500">
                Last updated: {currentLocation.timestamp.toLocaleTimeString()}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-gray-400 text-2xl mb-2">📍</div>
              <p className="text-sm text-gray-500">
                Enable location tracking to monitor your journey
              </p>
            </div>
          )}
        </Card>

        {/* Destination Setting */}
        <Card className="p-4">
          <LocationPicker
            label="Set Destination"
            location={destination}
            onLocationChange={setDestination}
            placeholder="Where are you going?"
          />
        </Card>

        {/* Trip Rating */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">Trip Experience (Optional)</h3>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl transition-colors ${
                  rating && rating >= star ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ⭐
              </button>
            ))}
          </div>
          {rating && (
            <p className="text-center text-sm text-gray-600">
              Rating: {rating}/5 stars
            </p>
          )}
        </Card>

        {/* Trip Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleCompleteTrip}
            disabled={!destination || isCompleting}
            className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg"
          >
            {isCompleting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Completing Trip...</span>
              </div>
            ) : (
              'Complete Trip'
            )}
          </Button>

          <Button
            onClick={handleCancelTrip}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
          >
            Cancel Trip
          </Button>

          {!destination && (
            <p className="text-sm text-gray-500 text-center">
              Set destination to complete the trip
            </p>
          )}
        </div>

        {/* Trip Details */}
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Trip Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Trip Number:</span>
              <span className="font-medium">#{activeTrip.tripNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Started:</span>
              <span className="font-medium">
                {new Date(activeTrip.startTime).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mode:</span>
              <span className="font-medium capitalize">
                {getModeLabel(activeTrip.mode)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Purpose:</span>
              <span className="font-medium capitalize">
                {activeTrip.purpose.replace('_', ' ')}
              </span>
            </div>
            {activeTrip.notes && (
              <div className="pt-2 border-t">
                <span className="text-gray-600 text-xs">Notes:</span>
                <p className="text-sm italic text-gray-700 mt-1">"{activeTrip.notes}"</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <NavigationBar />
    </div>
  );
}