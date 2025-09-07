"use client";

import { Trip } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getModeIcon, getModeLabel } from './TripModeSelector';
import { formatCoordinates } from '@/lib/geolocation';

interface TripCardProps {
  trip: Trip;
  onViewDetails?: (trip: Trip) => void;
  onCompleteTrip?: (trip: Trip) => void;
  onCancelTrip?: (trip: Trip) => void;
  showActions?: boolean;
}

export default function TripCard({ 
  trip, 
  onViewDetails, 
  onCompleteTrip, 
  onCancelTrip,
  showActions = false 
}: TripCardProps) {
  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Trip['status']) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '⚪';
    }
  };

  const getPurposeIcon = (purpose: Trip['purpose']) => {
    switch (purpose) {
      case 'work':
        return '💼';
      case 'education':
        return '🎓';
      case 'shopping':
        return '🛒';
      case 'medical':
        return '🏥';
      case 'social':
        return '👥';
      case 'leisure':
        return '🎉';
      case 'religious':
        return '🕯️';
      case 'business':
        return '🤝';
      case 'return_home':
        return '🏠';
      default:
        return '📍';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow duration-200">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">
              Trip #{trip.tripNumber}
            </span>
            <Badge className={getStatusColor(trip.status)}>
              {getStatusIcon(trip.status)} {trip.status.toUpperCase()}
            </Badge>
          </div>
          <span className="text-xs text-gray-500">
            {formatDate(trip.startTime)}
          </span>
        </div>

        {/* Trip Details */}
        <div className="space-y-2">
          {/* Mode and Purpose */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getModeIcon(trip.mode)}</span>
              <span className="text-sm font-medium text-gray-900">
                {getModeLabel(trip.mode)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm">{getPurposeIcon(trip.purpose)}</span>
              <span className="text-sm text-gray-600 capitalize">
                {trip.purpose.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <div className="flex items-start space-x-2">
              <span className="text-green-600 mt-0.5">🟢</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  {trip.origin.address || formatCoordinates(trip.origin)}
                </p>
              </div>
            </div>
            
            {trip.destination && (
              <div className="flex items-start space-x-2">
                <span className="text-red-600 mt-0.5">🔴</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {trip.destination.address || formatCoordinates(trip.destination)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Time and Duration */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>🕐 {formatTime(trip.startTime)}</span>
              {trip.endTime && (
                <span>→ {formatTime(trip.endTime)}</span>
              )}
            </div>
            {trip.duration && (
              <span className="font-medium">
                Duration: {formatDuration(trip.duration)}
              </span>
            )}
          </div>

          {/* Travelers */}
          {trip.totalTravelers > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm">👥</span>
              <span className="text-sm text-gray-600">
                {trip.totalTravelers} traveler{trip.totalTravelers > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Rating */}
          {trip.satisfactionRating && (
            <div className="flex items-center space-x-2">
              <span className="text-sm">⭐</span>
              <span className="text-sm text-gray-600">
                {trip.satisfactionRating}/5
              </span>
            </div>
          )}

          {/* Notes */}
          {trip.notes && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-600 italic">
                "{trip.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2 pt-2 border-t border-gray-100">
            {trip.status === 'active' && (
              <>
                {onCompleteTrip && (
                  <Button 
                    size="sm" 
                    onClick={() => onCompleteTrip(trip)}
                    className="flex-1"
                  >
                    Complete Trip
                  </Button>
                )}
                {onCancelTrip && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onCancelTrip(trip)}
                  >
                    Cancel
                  </Button>
                )}
              </>
            )}
            
            {onViewDetails && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onViewDetails(trip)}
                className={trip.status === 'active' ? '' : 'flex-1'}
              >
                View Details
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}