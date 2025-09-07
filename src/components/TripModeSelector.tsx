"use client";

import { TransportMode } from '@/lib/types';

interface TripModeSelectorProps {
  selectedMode: TransportMode | null;
  onModeSelect: (mode: TransportMode) => void;
  disabled?: boolean;
}

interface ModeOption {
  value: TransportMode;
  label: string;
  icon: string;
  color: string;
}

const transportModes: ModeOption[] = [
  { value: 'walk', label: 'Walking', icon: '🚶', color: 'bg-green-100 text-green-800' },
  { value: 'bicycle', label: 'Bicycle', icon: '🚲', color: 'bg-blue-100 text-blue-800' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️', color: 'bg-orange-100 text-orange-800' },
  { value: 'car', label: 'Car', icon: '🚗', color: 'bg-purple-100 text-purple-800' },
  { value: 'bus', label: 'Bus', icon: '🚌', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'train', label: 'Train', icon: '🚊', color: 'bg-red-100 text-red-800' },
  { value: 'metro', label: 'Metro', icon: '🚇', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'auto_rickshaw', label: 'Auto Rickshaw', icon: '🛺', color: 'bg-pink-100 text-pink-800' },
  { value: 'taxi', label: 'Taxi', icon: '🚕', color: 'bg-teal-100 text-teal-800' },
  { value: 'shared_taxi', label: 'Shared Taxi', icon: '🚖', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'other', label: 'Other', icon: '🚚', color: 'bg-gray-100 text-gray-800' }
];

export default function TripModeSelector({ selectedMode, onModeSelect, disabled = false }: TripModeSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Mode of Transport</h3>
      <div className="grid grid-cols-2 gap-3">
        {transportModes.map((mode) => {
          const isSelected = selectedMode === mode.value;
          
          return (
            <button
              key={mode.value}
              onClick={() => onModeSelect(mode.value)}
              disabled={disabled}
              className={`
                flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                ${isSelected
                  ? 'border-blue-600 bg-blue-50 scale-105'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              `}
            >
              <span className="text-2xl mb-2">{mode.icon}</span>
              <span className="text-sm font-medium text-gray-900 text-center">
                {mode.label}
              </span>
              {isSelected && (
                <div className="mt-2 w-full flex justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {selectedMode && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {transportModes.find(m => m.value === selectedMode)?.icon}
            </span>
            <span className="text-blue-800 font-medium">
              Selected: {transportModes.find(m => m.value === selectedMode)?.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Export mode utilities
export const getModeIcon = (mode: TransportMode): string => {
  return transportModes.find(m => m.value === mode)?.icon || '🚚';
};

export const getModeLabel = (mode: TransportMode): string => {
  return transportModes.find(m => m.value === mode)?.label || 'Other';
};

export const getModeColor = (mode: TransportMode): string => {
  return transportModes.find(m => m.value === mode)?.color || 'bg-gray-100 text-gray-800';
};