import { NextRequest, NextResponse } from 'next/server';
import { Trip, NewTripForm, APIResponse } from '@/lib/types';

// In-memory storage for demo purposes
// In production, this would connect to a real database
let trips: Trip[] = [];
let tripIdCounter = 1;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'current_user';
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '0');

    // Filter trips by user and optionally by status
    let filteredTrips = trips.filter(trip => trip.primaryTraveler === userId);
    
    if (status) {
      filteredTrips = filteredTrips.filter(trip => trip.status === status);
    }

    // Sort by creation date (newest first)
    filteredTrips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply limit if specified
    if (limit > 0) {
      filteredTrips = filteredTrips.slice(0, limit);
    }

    const response: APIResponse<Trip[]> = {
      success: true,
      data: filteredTrips,
      message: `Found ${filteredTrips.length} trips`
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, mode, purpose, purposeDetail, accompanyingTravelers, notes } = body;

    // Validate required fields
    if (!origin || !mode || !purpose) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: origin, mode, purpose' },
        { status: 400 }
      );
    }

    // Check for existing active trip
    const existingActiveTrip = trips.find(trip => 
      trip.primaryTraveler === 'current_user' && trip.status === 'active'
    );

    if (existingActiveTrip) {
      return NextResponse.json(
        { success: false, error: 'Cannot create new trip: active trip already exists' },
        { status: 400 }
      );
    }

    // Create new trip
    const now = new Date();
    const tripId = `trip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const newTrip: Trip = {
      id: tripId,
      tripNumber: tripIdCounter++,
      status: 'active',
      origin: {
        ...origin,
        timestamp: new Date(origin.timestamp)
      },
      startTime: now,
      mode,
      purpose,
      purposeDetail,
      primaryTraveler: 'current_user',
      accompanyingTravelers: accompanyingTravelers || [],
      totalTravelers: 1 + (accompanyingTravelers?.length || 0),
      notes,
      createdAt: now,
      updatedAt: now
    };

    trips.push(newTrip);

    const response: APIResponse<Trip> = {
      success: true,
      data: newTrip,
      message: 'Trip created successfully'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, updates } = body;

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: 'Missing tripId' },
        { status: 400 }
      );
    }

    // Find trip
    const tripIndex = trips.findIndex(trip => trip.id === tripId);
    
    if (tripIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Update trip
    trips[tripIndex] = {
      ...trips[tripIndex],
      ...updates,
      updatedAt: new Date()
    };

    // If completing trip, calculate duration
    if (updates.status === 'completed' && updates.destination && !updates.duration) {
      const startTime = new Date(trips[tripIndex].startTime);
      const endTime = new Date(updates.endTime || new Date());
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      trips[tripIndex].duration = durationMinutes;
    }

    const response: APIResponse<Trip> = {
      success: true,
      data: trips[tripIndex],
      message: 'Trip updated successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update trip' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: 'Missing tripId parameter' },
        { status: 400 }
      );
    }

    // Find and remove trip
    const tripIndex = trips.findIndex(trip => trip.id === tripId);
    
    if (tripIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Trip not found' },
        { status: 404 }
      );
    }

    const deletedTrip = trips.splice(tripIndex, 1)[0];

    const response: APIResponse<Trip> = {
      success: true,
      data: deletedTrip,
      message: 'Trip deleted successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}

// Export trip statistics endpoint
export async function OPTIONS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'current_user';
    const action = searchParams.get('action');

    if (action === 'stats') {
      const userTrips = trips.filter(trip => trip.primaryTraveler === userId);
      
      const stats = {
        total: userTrips.length,
        completed: userTrips.filter(t => t.status === 'completed').length,
        active: userTrips.filter(t => t.status === 'active').length,
        cancelled: userTrips.filter(t => t.status === 'cancelled').length,
        avgDuration: Math.round(
          userTrips
            .filter(t => t.duration)
            .reduce((sum, t) => sum + (t.duration || 0), 0) / 
          Math.max(userTrips.filter(t => t.duration).length, 1)
        ),
        totalDistance: 0, // Would calculate from coordinates in real app
        totalTravelers: userTrips.reduce((sum, t) => sum + t.totalTravelers, 0),
        byMode: userTrips.reduce((acc, trip) => {
          acc[trip.mode] = (acc[trip.mode] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byPurpose: userTrips.reduce((acc, trip) => {
          acc[trip.purpose] = (acc[trip.purpose] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return NextResponse.json({
        success: true,
        data: stats,
        message: 'Statistics retrieved successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting trip statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}