"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import NavigationBar from '@/components/NavigationBar';
import { useTravelers } from '@/hooks/useTravelers';
import { Traveler, TravelerForm } from '@/lib/types';

interface TravelerCardProps {
  traveler: Traveler;
  onEdit: (traveler: Traveler) => void;
  onDelete: (travelerId: string) => void;
  onToggleConsent: (travelerId: string, hasConsent: boolean) => void;
}

function TravelerCard({ traveler, onEdit, onDelete, onToggleConsent }: TravelerCardProps) {
  const getAgeGroupIcon = (ageGroup: string) => {
    switch (ageGroup) {
      case 'child': return '👶';
      case 'teen': return '🧒';
      case 'adult': return '🧑';
      case 'senior': return '👴';
      default: return '👤';
    }
  };

  const getRelationshipIcon = (relationship: string) => {
    const icons: { [key: string]: string } = {
      self: '👤',
      spouse: '💑',
      child: '👶',
      parent: '👨‍👩‍👧‍👦',
      sibling: '👫',
      friend: '👫',
      colleague: '🤝',
      other: '👥'
    };
    return icons[relationship] || '👥';
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {getAgeGroupIcon(traveler.ageGroup)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{traveler.name}</h3>
              <p className="text-sm text-gray-600 capitalize">
                {getRelationshipIcon(traveler.relationship)} {traveler.relationship} • {traveler.ageGroup}
              </p>
            </div>
          </div>
          
          {/* Consent Status */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            traveler.hasConsent
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {traveler.hasConsent ? '✅ Consented' : '❌ No Consent'}
          </div>
        </div>

        {/* Consent Toggle */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <Label htmlFor={`consent-${traveler.id}`} className="text-sm">
            Data collection consent
          </Label>
          <Switch
            id={`consent-${traveler.id}`}
            checked={traveler.hasConsent}
            onCheckedChange={(checked) => onToggleConsent(traveler.id, checked)}
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(traveler)}
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(traveler.id)}
            className="text-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>

        {/* Metadata */}
        <div className="pt-2 border-t text-xs text-gray-500">
          Added: {new Date(traveler.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Card>
  );
}

export default function TravelersPage() {
  const {
    travelers,
    loading,
    error,
    addTraveler,
    updateTraveler,
    deleteTraveler,
    getTravelerStats
  } = useTravelers();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState<Traveler | null>(null);
  const [formData, setFormData] = useState<TravelerForm>({
    name: '',
    ageGroup: 'adult',
    relationship: 'other',
    hasConsent: false
  });

  const stats = getTravelerStats();

  const resetForm = () => {
    setFormData({
      name: '',
      ageGroup: 'adult',
      relationship: 'other',
      hasConsent: false
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a name');
      return;
    }

    try {
      if (editingTraveler) {
        const success = await updateTraveler(editingTraveler.id, formData);
        if (success) {
          setEditingTraveler(null);
          setIsAddDialogOpen(false);
          resetForm();
        }
      } else {
        const travelerId = await addTraveler(formData);
        if (travelerId) {
          setIsAddDialogOpen(false);
          resetForm();
        }
      }
    } catch (err) {
      console.error('Error saving traveler:', err);
    }
  };

  const handleEdit = (traveler: Traveler) => {
    setEditingTraveler(traveler);
    setFormData({
      name: traveler.name,
      ageGroup: traveler.ageGroup,
      relationship: traveler.relationship,
      hasConsent: traveler.hasConsent
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (travelerId: string) => {
    if (!confirm('Are you sure you want to delete this traveler? This action cannot be undone.')) {
      return;
    }

    await deleteTraveler(travelerId);
  };

  const handleToggleConsent = async (travelerId: string, hasConsent: boolean) => {
    await updateTraveler(travelerId, { hasConsent });
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingTraveler(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Travelers</h1>
            <p className="text-blue-100 text-sm">
              Manage accompanying travelers
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-700"
                onClick={() => setIsAddDialogOpen(true)}
              >
                + Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>
                  {editingTraveler ? 'Edit Traveler' : 'Add New Traveler'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter traveler name"
                  />
                </div>

                <div>
                  <Label htmlFor="ageGroup">Age Group</Label>
                  <Select
                    value={formData.ageGroup}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, ageGroup: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">👶 Child (0-12)</SelectItem>
                      <SelectItem value="teen">🧒 Teen (13-17)</SelectItem>
                      <SelectItem value="adult">🧑 Adult (18-59)</SelectItem>
                      <SelectItem value="senior">👴 Senior (60+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select
                    value={formData.relationship}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, relationship: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">💑 Spouse</SelectItem>
                      <SelectItem value="child">👶 Child</SelectItem>
                      <SelectItem value="parent">👨‍👩‍👧‍👦 Parent</SelectItem>
                      <SelectItem value="sibling">👫 Sibling</SelectItem>
                      <SelectItem value="friend">👫 Friend</SelectItem>
                      <SelectItem value="colleague">🤝 Colleague</SelectItem>
                      <SelectItem value="other">👥 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="consent"
                    checked={formData.hasConsent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasConsent: checked }))}
                  />
                  <Label htmlFor="consent" className="text-sm">
                    Grant data collection consent
                  </Label>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Saving...' : editingTraveler ? 'Update' : 'Add Traveler'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDialogClose}
                  >
                    Cancel
                  </Button>
                </div>

                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4">
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{stats.withConsent}</div>
              <div className="text-xs text-gray-600">With Consent</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">{stats.withoutConsent}</div>
              <div className="text-xs text-gray-600">No Consent</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Traveler List */}
      <div className="px-4 pb-20 space-y-4">
        {travelers.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No travelers yet
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Add travelers who frequently accompany you on trips
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="mx-auto"
            >
              Add First Traveler
            </Button>
          </Card>
        ) : (
          <>
            {travelers.map((traveler) => (
              <TravelerCard
                key={traveler.id}
                traveler={traveler}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleConsent={handleToggleConsent}
              />
            ))}
          </>
        )}

        {/* Consent Notice */}
        {travelers.some(t => !t.hasConsent) && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800 mb-1">Consent Required</h4>
                <p className="text-yellow-700 text-sm">
                  Some travelers haven't provided consent for data collection. 
                  They won't be available for trip selection until consent is granted.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <NavigationBar />
    </div>
  );
}