"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NavigationBar from '@/components/NavigationBar';
import TripCard from '@/components/TripCard';
import { useTripHistory } from '@/hooks/useTrips';
import { TripStatus, TransportMode, TripPurpose } from '@/lib/types';

const statusOptions: { value: TripStatus; label: string; icon: string }[] = [
  { value: 'completed', label: 'Completed', icon: '✅' },
  { value: 'cancelled', label: 'Cancelled', icon: '❌' },
  { value: 'active', label: 'Active', icon: '🟢' }
];

const modeOptions: { value: TransportMode; label: string }[] = [
  { value: 'walk', label: 'Walking' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'car', label: 'Car' },
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Train' },
  { value: 'metro', label: 'Metro' }
];

const purposeOptions: { value: TripPurpose; label: string }[] = [
  { value: 'work', label: 'Work' },
  { value: 'education', label: 'Education' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'medical', label: 'Medical' },
  { value: 'social', label: 'Social' },
  { value: 'leisure', label: 'Leisure' }
];

export default function TripHistoryPage() {
  const {
    trips,
    allTrips,
    currentPage,
    totalPages,
    totalTrips,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    setFilter,
    filter
  } = useTripHistory(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    if (value === 'all') {
      const newFilter = { ...filter };
      delete newFilter[key as keyof typeof filter];
      setFilter(newFilter);
    } else {
      setFilter({ ...filter, [key]: value });
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // In a real app, you'd implement search functionality
    // For now, this is just visual feedback
  };

  const clearFilters = () => {
    setFilter({});
    setSearchTerm('');
  };

  const hasActiveFilters = Object.keys(filter).length > 0 || searchTerm.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Trip History</h1>
              <p className="text-blue-100 text-sm">
                {totalTrips} trip{totalTrips !== 1 ? 's' : ''} found
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-white hover:bg-blue-700"
            >
              {showFilters ? '✕' : '🔍'} Filters
            </Button>
          </div>

          {/* Search Bar */}
          <div>
            <Input
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
            />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="m-4 p-4 space-y-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-blue-600"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Status
              </label>
              <Select
                value={filter.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Transport Mode
              </label>
              <Select
                value={filter.mode || 'all'}
                onValueChange={(value) => handleFilterChange('mode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {modeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purpose Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Trip Purpose
              </label>
              <Select
                value={filter.purpose || 'all'}
                onValueChange={(value) => handleFilterChange('purpose', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All purposes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Purposes</SelectItem>
                  {purposeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="pt-2 border-t">
              <p className="text-sm text-blue-600 font-medium">
                Active filters: {Object.keys(filter).length + (searchTerm ? 1 : 0)}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Trip Stats */}
      <div className="px-4 pb-4">
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {allTrips.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">
                {Math.round(
                  allTrips
                    .filter(t => t.duration)
                    .reduce((sum, t) => sum + (t.duration || 0), 0) /
                  Math.max(allTrips.filter(t => t.duration).length, 1)
                )}m
              </div>
              <div className="text-xs text-gray-600">Avg Duration</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {allTrips.reduce((sum, t) => sum + t.totalTravelers, 0)}
              </div>
              <div className="text-xs text-gray-600">Total Travelers</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Trip List */}
      <div className="px-4 pb-20 space-y-4">
        {trips.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">🚗</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {hasActiveFilters ? 'No trips found' : 'No trips yet'}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your filters to see more results'
                : 'Start your first trip to see it here'
              }
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mx-auto"
              >
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <>
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                showActions={false}
                onViewDetails={() => {
                  // In a full app, this would navigate to trip details
                  console.log('View trip details:', trip.id);
                }}
              />
            ))}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevPage}
                disabled={!hasPrevPage}
                size="sm"
              >
                ← Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={nextPage}
                disabled={!hasNextPage}
                size="sm"
              >
                Next →
              </Button>
            </div>
          </Card>
        )}
      </div>

      <NavigationBar />
    </div>
  );
}