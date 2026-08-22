import { useState, useEffect } from 'react';
import type { GPSState } from '../types';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export function useLocation() {
  const [gpsState, setGpsState] = useState<GPSState>('acquiring');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsState('unavailable');
      setError('Geolocation is not supported by your browser');
      return;
    }

    setGpsState('acquiring');

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      
      setGpsState('active');
      setLocation({
        latitude,
        longitude,
        accuracy: Math.round(accuracy),
        heading: heading !== null && !isNaN(heading) ? heading : null,
        speed: speed !== null && !isNaN(speed) ? Math.round(speed * 3.6) : null, // convert m/s to km/h if present
        timestamp: position.timestamp,
      });
      setError(null);
    };

    const handleError = (err: GeolocationPositionError) => {
      setGpsState('unavailable');
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError('Location permission denied');
          break;
        case err.POSITION_UNAVAILABLE:
          setError('Position unavailable');
          break;
        case err.TIMEOUT:
          setError('Location request timed out');
          break;
        default:
          setError('An unknown error occurred');
          break;
      }
    };

    // Immediate single fix for fastest startup
    navigator.geolocation.getCurrentPosition(handleSuccess, () => {}, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });

    // Continuous watch for real-time tracking
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { gpsState, location, error };
}

