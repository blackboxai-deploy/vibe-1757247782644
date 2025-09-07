"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import NavigationBar from '@/components/NavigationBar';
import { ConsentData, AppSettings } from '@/lib/types';
import { storageService } from '@/lib/storage';

interface ConsentItem {
  key: keyof Omit<ConsentData, 'userId' | 'consentDate' | 'ipAddress' | 'userAgent'>;
  title: string;
  description: string;
  required: boolean;
  icon: string;
}

const consentItems: ConsentItem[] = [
  {
    key: 'dataCollection',
    title: 'Data Collection',
    description: 'Allow collection of trip data including locations, times, and travel modes for transportation research',
    required: true,
    icon: '📊'
  },
  {
    key: 'locationTracking',
    title: 'Location Tracking',
    description: 'Enable GPS location services to automatically capture trip origins and destinations',
    required: true,
    icon: '📍'
  },
  {
    key: 'dataSharing',
    title: 'Anonymous Data Sharing',
    description: 'Share anonymized trip data with NATPAC researchers for transportation planning studies',
    required: false,
    icon: '🔄'
  },
  {
    key: 'researchParticipation',
    title: 'Research Participation',
    description: 'Participate in optional research surveys and studies related to transportation patterns',
    required: false,
    icon: '🔬'
  },
  {
    key: 'marketingCommunications',
    title: 'Updates & Communications',
    description: 'Receive updates about the app, new features, and transportation research findings',
    required: false,
    icon: '📧'
  }
];

export default function ConsentPage() {
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing consent and settings
  useEffect(() => {
    const loadData = () => {
      try {
        const existingConsent = storageService.getConsent();
        const existingSettings = storageService.getSettings();
        
        if (existingConsent) {
          setConsent(existingConsent);
        } else {
          // Initialize with default consent
          setConsent({
            userId: 'current_user',
            dataCollection: false,
            locationTracking: false,
            dataSharing: false,
            researchParticipation: false,
            marketingCommunications: false,
            consentDate: new Date()
          });
        }
        
        setSettings(existingSettings);
      } catch (error) {
        console.error('Error loading consent data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleConsentChange = (key: ConsentItem['key'], value: boolean) => {
    if (!consent) return;
    
    setConsent(prev => prev ? {
      ...prev,
      [key]: value
    } : null);
  };

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    if (!settings) return;
    
    setSettings(prev => prev ? {
      ...prev,
      [key]: value
    } : null);
  };

  const handleSave = async () => {
    if (!consent || !settings) return;
    
    setIsSaving(true);
    
    try {
      // Update consent timestamp
      const updatedConsent: ConsentData = {
        ...consent,
        consentDate: new Date(),
        ipAddress: 'mobile_app',
        userAgent: navigator.userAgent
      };
      
      // Save to storage
      storageService.saveConsent(updatedConsent);
      storageService.saveSettings(settings);
      
      // Update state
      setConsent(updatedConsent);
      
      alert('Privacy settings saved successfully!');
    } catch (error) {
      console.error('Error saving consent:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataExport = () => {
    try {
      const allData = storageService.exportAllData();
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `natpac_travel_data_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleDataClear = () => {
    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return;
    }
    
    if (!confirm('This will permanently delete all trips, travelers, and settings. Continue?')) {
      return;
    }
    
    try {
      storageService.clearAllData();
      alert('All data has been deleted successfully.');
      
      // Reset state
      setConsent({
        userId: 'current_user',
        dataCollection: false,
        locationTracking: false,
        dataSharing: false,
        researchParticipation: false,
        marketingCommunications: false,
        consentDate: new Date()
      });
      
      // Reload page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to delete data. Please try again.');
    }
  };

  if (isLoading || !consent || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading privacy settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">Privacy & Consent</h1>
        <p className="text-blue-100 text-sm">
          Manage your data privacy preferences
        </p>
      </div>

      {/* Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* NATPAC Information */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">🏛️</span>
              <h3 className="font-semibold text-blue-900">About NATPAC</h3>
            </div>
            <p className="text-blue-800 text-sm leading-relaxed">
              The National Transportation Planning and Research Centre (NATPAC) is a premier research 
              organization dedicated to improving transportation systems. Your trip data helps us 
              understand travel patterns and develop better transportation policies.
            </p>
          </div>
        </Card>

        {/* Data Collection Consents */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Data Collection Permissions</h2>
          
          {consentItems.map((item) => (
            <Card key={item.key} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        {item.title}
                        {item.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </h3>
                      <Switch
                        id={item.key}
                        checked={consent[item.key]}
                        onCheckedChange={(value) => handleConsentChange(item.key, value)}
                        disabled={item.required && consent[item.key]}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.description}
                    </p>
                    {item.required && (
                      <p className="text-xs text-red-600">
                        Required for app functionality
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Separator />

        {/* App Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">App Settings</h2>
          
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Auto-detect Location</Label>
                <p className="text-sm text-gray-600">
                  Automatically capture GPS location for trips
                </p>
              </div>
              <Switch
                checked={settings.autoDetectLocation}
                onCheckedChange={(value) => handleSettingChange('autoDetectLocation', value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Background Tracking</Label>
                <p className="text-sm text-gray-600">
                  Continue tracking location in background (experimental)
                </p>
              </div>
              <Switch
                checked={settings.backgroundTracking}
                onCheckedChange={(value) => handleSettingChange('backgroundTracking', value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Notifications</Label>
                <p className="text-sm text-gray-600">
                  Receive trip reminders and updates
                </p>
              </div>
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(value) => handleSettingChange('notificationsEnabled', value)}
              />
            </div>
          </Card>
        </div>

        <Separator />

        {/* Data Management */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
          
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Export Your Data</h3>
              <p className="text-sm text-gray-600">
                Download all your trip data in JSON format
              </p>
              <Button
                variant="outline"
                onClick={handleDataExport}
                className="w-full"
              >
                📄 Export Data
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-medium text-red-600">Delete All Data</h3>
              <p className="text-sm text-gray-600">
                Permanently delete all your trips, travelers, and settings
              </p>
              <Button
                variant="outline"
                onClick={handleDataClear}
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
              >
                🗑️ Delete All Data
              </Button>
            </div>
          </Card>
        </div>

        {/* Consent Information */}
        {consent.consentDate && (
          <Card className="p-4 bg-gray-50">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Consent Record</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Last updated: {new Date(consent.consentDate).toLocaleString()}</p>
                <p>User ID: {consent.userId}</p>
                {consent.ipAddress && consent.ipAddress !== 'mobile_app' && (
                  <p>IP Address: {consent.ipAddress}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 text-lg"
        >
          {isSaving ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Save Privacy Settings'
          )}
        </Button>

        {/* Legal Notice */}
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-900">Important Notice</h4>
            <p className="text-yellow-800 text-sm">
              By using this app, you acknowledge that trip data will be used for transportation 
              research purposes. All data is handled according to privacy regulations and NATPAC's 
              data protection policies. You can withdraw consent at any time.
            </p>
          </div>
        </Card>
      </div>

      <NavigationBar />
    </div>
  );
}