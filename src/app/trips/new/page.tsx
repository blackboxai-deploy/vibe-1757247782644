"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NavigationBar from '@/components/NavigationBar';
import TripModeSelector from '@/components/TripModeSelector';
import LocationPicker from '@/components/LocationPicker';
import { useTrips } from '@/hooks/useTrips';
import { useTravelers } from '@/hooks/useTravelers';
import { useGeolocation } from '@/hooks/useGeolocation';
import { TransportMode, TripPurpose, Location } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';

const tripPurposes: { value: TripPurpose; label: string; icon: string }[] = [
  { value: 'work', label: 'Work', icon: '💼' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'shopping', label: 'Shopping', icon: '🛒' },
  { value: 'medical', label: 'Medical', icon: '🏥' },
  { value: 'social', label: 'Social Visit', icon: '👥' },
  { value: 'leisure', label: 'Leisure', icon: '🎉' },
  { value: 'religious', label: 'Religious', icon: '🕯️' },
  { value: 'business', label: 'Business', icon: '🤝' },
  { value: 'return_home', label: 'Return Home', icon: '🏠' },
  { value: 'other', label: 'Other', icon: '📍' }
];

export default function NewTripPage() {
  const router = useRouter();
  const { createTrip, loading: tripLoading, error: tripError } = useTrips();
  const { travelers, getConsentedTravelers } = useTravelers();
  const { location: currentLocation, getCurrentLocation } = useGeolocation();

  // Form state
  const [origin, setOrigin] = useState<Location | null>(null);
  const [mode, setMode] = useState<TransportMode | null>(null);
  const [purpose, setPurpose] = useState<TripPurpose>('other');
  const [purposeDetail, setPurposeDetail] = useState('');
  const [selectedTravelers, setSelectedTravelers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const consentedTravelers = getConsentedTravelers();

  const handleTravelerToggle = (travelerId: string) => {
    setSelectedTravelers(prev => 
      prev.includes(travelerId)
        ? prev.filter(id => id !== travelerId)
        : [...prev, travelerId]
    );
  };

  const handleSubmit = async () => {
    if (!origin) {
      alert('Please set the origin location');
      return;
    }

    if (!mode) {
      alert('Please select a mode of transport');
      return;
    }

    setIsSubmitting(true);

    try {
      const tripData = {
        origin,
        mode,
        purpose,
        purposeDetail: purposeDetail.trim() || undefined,
        accompanyingTravelers: selectedTravelers,
        notes: notes.trim() || undefined
      };

      const tripId = await createTrip(tripData);

      if (tripId) {
        router.push('/trips/active');
      } else {
        alert(tripError || 'Failed to create trip');
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">New Trip</h1>
            <p className="text-blue-100 text-sm">Capture your travel details</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white hover:bg-blue-700"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* Origin Location */}
        <Card className="p-4">
          <LocationPicker
            label="Starting Point"
            location={origin}
            onLocationChange={setOrigin}
            placeholder="Where are you starting from?"
            required
          />
        </Card>

        {/* Mode of Transport */}
        <Card className="p-4">
          <TripModeSelector
            selectedMode={mode}
            onModeSelect={setMode}
          />
        </Card>

        {/* Trip Purpose */}
        <Card className="p-4 space-y-4">
          <Label className="text-lg font-semibold">Trip Purpose</Label>
          <Select value={purpose} onValueChange={(value: TripPurpose) => setPurpose(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select trip purpose" />
            </SelectTrigger>
            <SelectContent>
              {tripPurposes.map((purposeOption) => (
                <SelectItem key={purposeOption.value} value={purposeOption.value}>
                  <div className="flex items-center space-x-2">
                    <span>{purposeOption.icon}</span>
                    <span>{purposeOption.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Purpose Detail */}
          {purpose === 'other' && (
            <div className="space-y-2">
              <Label>Specify Purpose</Label>
              <Input
                placeholder="Enter specific purpose"
                value={purposeDetail}
                onChange={(e) => setPurposeDetail(e.target.value)}
              />
            </div>
          )}
        </Card>

        {/* Accompanying Travelers */}
        {consentedTravelers.length > 0 && (
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                Accompanying Travelers
              </Label>
              <p className="text-sm text-gray-600">
                Select travelers who are joining you on this trip
              </p>
            </div>

            <div className="space-y-3">
              {consentedTravelers.map((traveler) => (
                <div key={traveler.id} className="flex items-center space-x-3 p-2 rounded border">
                  <Checkbox
                    id={traveler.id}
                    checked={selectedTravelers.includes(traveler.id)}
                    onCheckedChange={() => handleTravelerToggle(traveler.id)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={traveler.id} className="cursor-pointer">
                      <div className="font-medium">{traveler.name}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {traveler.relationship} • {traveler.ageGroup}
                      </div>
                    </Label>
                  </div>
                </div>
              ))}
            </div>

            {selectedTravelers.length > 0 && (
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  {selectedTravelers.length} traveler(s) selected
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Additional Notes */}
        <Card className="p-4 space-y-4">
          <Label className="text-lg font-semibold">Additional Notes</Label>
          <Textarea
            placeholder="Any additional information about this trip? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </Card>

        {/* Trip Summary */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900">Trip Summary</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Origin:</span>
                <span className="font-medium">
                  {origin ? (origin.address || 'Location set') : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="font-medium capitalize">
                  {mode ? mode.replace('_', ' ') : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Purpose:</span>
                <span className="font-medium capitalize">
                  {purpose.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Travelers:</span>
                <span className="font-medium">
                  {1 + selectedTravelers.length}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={!origin || !mode || isSubmitting}
            className="w-full py-3 text-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Starting Trip...</span>
              </div>
            ) : (
              'Start Trip'
            )}
          </Button>

          {(!origin || !mode) && (
            <p className="text-sm text-gray-500 text-center">
              Please set origin location and select transport mode to continue
            </p>
          )}

          {tripError && (
            <Card className="p-3 bg-red-50 border-red-200">
              <p className="text-red-800 text-sm">{tripError}</p>
            </Card>
          )}
        </div>
      </div>

      <NavigationBar />
    </div>
  );
}