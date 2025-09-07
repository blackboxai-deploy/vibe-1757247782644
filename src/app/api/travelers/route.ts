import { NextRequest, NextResponse } from 'next/server';
import { Traveler, TravelerForm, APIResponse } from '@/lib/types';

// In-memory storage for demo purposes
// In production, this would connect to a real database
let travelers: Traveler[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'current_user';
    const hasConsent = searchParams.get('hasConsent');

    // Filter travelers by user (in a real app, travelers would be associated with users)
    let filteredTravelers = travelers;
    
    if (hasConsent !== null) {
      const consentFilter = hasConsent === 'true';
      filteredTravelers = filteredTravelers.filter(traveler => 
        traveler.hasConsent === consentFilter
      );
    }

    // Sort by creation date (newest first)
    filteredTravelers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const response: APIResponse<Traveler[]> = {
      success: true,
      data: filteredTravelers,
      message: `Found ${filteredTravelers.length} travelers`
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching travelers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch travelers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TravelerForm = await request.json();
    const { name, ageGroup, relationship, hasConsent } = body;

    // Validate required fields
    if (!name || !ageGroup || !relationship) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, ageGroup, relationship' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existingTraveler = travelers.find(
      t => t.name.toLowerCase() === name.toLowerCase()
    );

    if (existingTraveler) {
      return NextResponse.json(
        { success: false, error: 'A traveler with this name already exists' },
        { status: 400 }
      );
    }

    // Create new traveler
    const travelerId = `traveler_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const newTraveler: Traveler = {
      id: travelerId,
      name: name.trim(),
      ageGroup,
      relationship,
      hasConsent: hasConsent || false,
      createdAt: new Date()
    };

    travelers.push(newTraveler);

    const response: APIResponse<Traveler> = {
      success: true,
      data: newTraveler,
      message: 'Traveler created successfully'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating traveler:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create traveler' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { travelerId, updates } = body;

    if (!travelerId) {
      return NextResponse.json(
        { success: false, error: 'Missing travelerId' },
        { status: 400 }
      );
    }

    // Find traveler
    const travelerIndex = travelers.findIndex(traveler => traveler.id === travelerId);
    
    if (travelerIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Traveler not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name if updating name
    if (updates.name) {
      const existingTraveler = travelers.find(
        t => t.id !== travelerId && t.name.toLowerCase() === updates.name.toLowerCase()
      );

      if (existingTraveler) {
        return NextResponse.json(
          { success: false, error: 'A traveler with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update traveler
    travelers[travelerIndex] = {
      ...travelers[travelerIndex],
      ...updates
    };

    const response: APIResponse<Traveler> = {
      success: true,
      data: travelers[travelerIndex],
      message: 'Traveler updated successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating traveler:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update traveler' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const travelerId = searchParams.get('travelerId');

    if (!travelerId) {
      return NextResponse.json(
        { success: false, error: 'Missing travelerId parameter' },
        { status: 400 }
      );
    }

    // Find and remove traveler
    const travelerIndex = travelers.findIndex(traveler => traveler.id === travelerId);
    
    if (travelerIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Traveler not found' },
        { status: 404 }
      );
    }

    const deletedTraveler = travelers.splice(travelerIndex, 1)[0];

    const response: APIResponse<Traveler> = {
      success: true,
      data: deletedTraveler,
      message: 'Traveler deleted successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting traveler:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete traveler' },
      { status: 500 }
    );
  }
}

// Export traveler statistics endpoint
export async function OPTIONS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = {
        total: travelers.length,
        withConsent: travelers.filter(t => t.hasConsent).length,
        withoutConsent: travelers.filter(t => !t.hasConsent).length,
        byAgeGroup: travelers.reduce((acc, traveler) => {
          acc[traveler.ageGroup] = (acc[traveler.ageGroup] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byRelationship: travelers.reduce((acc, traveler) => {
          acc[traveler.relationship] = (acc[traveler.relationship] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return NextResponse.json({
        success: true,
        data: stats,
        message: 'Statistics retrieved successfully'
      });
    }

    if (action === 'consent-summary') {
      const consentSummary = {
        totalTravelers: travelers.length,
        consented: travelers.filter(t => t.hasConsent).length,
        pending: travelers.filter(t => !t.hasConsent).length,
        consentRate: travelers.length > 0 ? 
          Math.round((travelers.filter(t => t.hasConsent).length / travelers.length) * 100) : 0
      };

      return NextResponse.json({
        success: true,
        data: consentSummary,
        message: 'Consent summary retrieved successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting traveler statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}