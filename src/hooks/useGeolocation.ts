import { useState, useCallback, useRef, useEffect } from 'react';

type GeolocationState = 'idle' | 'loading' | 'success' | 'denied' | 'unavailable' | 'timeout';

interface GeolocationResult {
  state: GeolocationState;
  coordinates: [number, number] | null;
  error: string | null;
  speed: number | null;
}

export function useGeolocation() {
  const [result, setResult] = useState<GeolocationResult>({
    state: 'idle',
    coordinates: null,
    error: null,
    speed: null,
  });

  const watchIdRef = useRef<number | null>(null);

  const handleError = (error: GeolocationPositionError) => {
    let state: GeolocationState = 'unavailable';
    let errorMsg = 'An unknown error occurred while accessing location.';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        state = 'denied';
        errorMsg = 'Location permission was denied. Please enable location access.';
        break;
      case error.POSITION_UNAVAILABLE:
        state = 'unavailable';
        errorMsg = 'Location information is unavailable at this time.';
        break;
      case error.TIMEOUT:
        state = 'timeout';
        errorMsg = 'The request to get user location timed out.';
        break;
    }

    setResult({
      state,
      coordinates: null,
      error: errorMsg,
      speed: null,
    });
  };

  const handleSuccess = (position: GeolocationPosition) => {
    setResult({
      state: 'success',
      coordinates: [position.coords.latitude, position.coords.longitude],
      error: null,
      speed: position.coords.speed,
    });
  };

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setResult({
        state: 'unavailable',
        coordinates: null,
        error: 'Geolocation is not supported by your browser.',
        speed: null,
      });
      return;
    }

    setResult((prev) => ({ ...prev, state: 'loading', error: null }));

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  }, []);

  const watchLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setResult({
        state: 'unavailable',
        coordinates: null,
        error: 'Geolocation is not supported by your browser.',
        speed: null,
      });
      return;
    }

    if (watchIdRef.current !== null) return; // Already watching

    setResult((prev) => ({ ...prev, state: 'loading', error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return { ...result, requestLocation, watchLocation, stopWatching };
}
