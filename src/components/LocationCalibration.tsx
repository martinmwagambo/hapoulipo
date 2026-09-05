'use client';

import React, { useState, useCallback } from 'react';
import { MapPin, Loader2, CheckCircle, XCircle, Navigation } from 'lucide-react';
import {
  detectUserLocation,
  reverseGeocode,
  saveUserLocation,
  LocationStatus,
} from '@/lib/locationUtils';

interface LocationCalibrationProps {
  onLocationSaved?: (lat: number, lng: number, city: string) => void;
  compact?: boolean;
  currentLat?: number;
  currentLng?: number;
  currentCity?: string;
}

export default function LocationCalibration({
  onLocationSaved,
  compact = false,
  currentLat,
  currentLng,
  currentCity,
}: LocationCalibrationProps) {
  const [status, setStatus] = useState<LocationStatus>(
    currentLat && currentLng ? 'success' : 'idle'
  );
  const [detectedCity, setDetectedCity] = useState(currentCity || '');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDetect = useCallback(async () => {
    setStatus('detecting');
    setErrorMsg('');
    try {
      const pos = await detectUserLocation();
      setAccuracy(pos.accuracy ?? null);

      // Reverse geocode to get city name
      const city = await reverseGeocode(pos.lat, pos.lng);
      setDetectedCity(city);

      // Save to localStorage + Supabase
      await saveUserLocation(pos.lat, pos.lng, city);

      setStatus('success');
      onLocationSaved?.(pos.lat, pos.lng, city);
    } catch (err: unknown) {
      const geoErr = err as GeolocationPositionError;
      if (geoErr?.code === 1) {
        setStatus('denied');
        setErrorMsg('Location access denied. Please allow location in your browser settings.');
      } else {
        setStatus('error');
        setErrorMsg('Could not detect location. Please try again.');
      }
    }
  }, [onLocationSaved]);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {status === 'success' ? (
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle size={14} />
            <span className="font-medium">{detectedCity || 'Location saved'}</span>
            <button
              onClick={handleDetect}
              className="ml-1 text-xs text-muted-foreground hover:text-primary underline"
            >
              Update
            </button>
          </div>
        ) : (
          <button
            onClick={handleDetect}
            disabled={status === 'detecting'}
            className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline disabled:opacity-60"
          >
            {status === 'detecting' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Navigation size={14} />
            )}
            {status === 'detecting' ? 'Detecting...' : 'Detect My Location'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
          <MapPin size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-card-foreground">Location Calibration</h3>
          <p className="text-xs text-muted-foreground">
            Detect your real GPS location to enable nearest-first matching
          </p>
        </div>
      </div>

      {/* Current location display */}
      {status === 'success' && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
          <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">
              {detectedCity ? `📍 ${detectedCity}` : '📍 Location detected'}
            </p>
            {accuracy !== null && (
              <p className="text-xs text-green-600 mt-0.5">Accuracy: ±{Math.round(accuracy)}m</p>
            )}
          </div>
        </div>
      )}

      {/* Error display */}
      {(status === 'denied' || status === 'error') && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={handleDetect}
        disabled={status === 'detecting'}
        className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'detecting' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Detecting GPS location...
          </>
        ) : status === 'success' ? (
          <>
            <Navigation size={16} />
            Update My Location
          </>
        ) : (
          <>
            <Navigation size={16} />
            Detect My Location
          </>
        )}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Your location is used only to show you the nearest vendors and services.
      </p>
    </div>
  );
}
