"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import NavigationBar from '@/components/NavigationBar';
import TripCard from '@/components/TripCard';
import { useTrips } from '@/hooks/useTrips';
import { useTravelers } from '@/hooks/useTravelers';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { trips, activeTrip, getTripStats } = useTrips();
  const { travelers, getTravelerStats } = useTravelers();
  const { location, hasPermission } = useGeolocation();

  const tripStats = getTripStats();
  const travelerStats = getTravelerStats();
  const recentTrips = trips
    .filter(trip => trip.status === 'completed')
    .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime())
    .slice(0, 3);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 pb-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">NATPAC Travel</h1>
              <p className="text-blue-100 text-sm">Transportation Data Collection</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">
                {currentTime.toLocaleDateString()}
              </p>
              <p className="text-lg font-semibold">
                {currentTime.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>

          {/* Location Status */}
          <div className="flex items-center space-x-2 text-sm">
            <span>{hasPermission ? '📍' : '📍❌'}</span>
            <span className="text-blue-100">
              {hasPermission 
                ? location 
                  ? 'Location enabled' 
                  : 'Location ready'
                : 'Location disabled'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* Active Trip Section */}
        {activeTrip ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <span>🟢</span>
              <span>Active Trip</span>
            </h2>
            <TripCard 
              trip={activeTrip} 
              showActions={true}
              onViewDetails={() => {}}
            />
            <div className="flex space-x-3">
              <Link href={`/trips/active`} className="flex-1">
                <Button className="w-full">
                  Manage Trip
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* New Trip Section */
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Start New Trip</h2>
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="text-center space-y-4">
                <div className="text-4xl">🚗</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ready to travel?</h3>
                  <p className="text-gray-600 text-sm">
                    Capture your trip data to help improve transportation planning
                  </p>
                </div>
                <Link href="/trips/new">
                  <Button size="lg" className="w-full">
                    Start New Trip
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Quick Stats */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tripStats.total}
              </div>
              <div className="text-sm text-gray-600">Total Trips</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {tripStats.completed}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {tripStats.avgDuration}m
              </div>
              <div className="text-sm text-gray-600">Avg Duration</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {travelerStats.total}
              </div>
              <div className="text-sm text-gray-600">Travelers</div>
            </Card>
          </div>
        </div>

        {/* Recent Trips */}
        {recentTrips.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Trips</h2>
              <Link href="/trips/history">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/travelers">
              <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="text-center space-y-2">
                  <div className="text-2xl">👥</div>
                  <div className="text-sm font-medium">Manage Travelers</div>
                </div>
              </Card>
            </Link>
            <Link href="/consent">
              <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="text-center space-y-2">
                  <div className="text-2xl">🔒</div>
                  <div className="text-sm font-medium">Privacy Settings</div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* System Status */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-green-800 font-medium">System Status</span>
            </div>
            <div className="space-y-1 text-sm text-green-700">
              <div className="flex justify-between">
                <span>Location Services:</span>
                <span className="font-medium">
                  {hasPermission ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Data Storage:</span>
                <span className="font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span>Travelers with Consent:</span>
                <span className="font-medium">{travelerStats.withConsent}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <NavigationBar />
    </div>
  );
}