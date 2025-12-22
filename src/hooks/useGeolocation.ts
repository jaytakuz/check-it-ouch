import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: true,
  });

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options;

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      isLoading: false,
    });
  }, []);

  const onError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location permission denied";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location unavailable";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out";
        break;
      default:
        errorMessage = "Unknown location error";
    }
    
    setState((prev) => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
    }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation not supported",
        isLoading: false,
      }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      { enableHighAccuracy, timeout, maximumAge }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);

  const calculateDistance = useCallback(
    (targetLat: number, targetLng: number): number | null => {
      if (state.latitude === null || state.longitude === null) return null;

      const R = 6371000; // Earth's radius in meters
      const dLat = (targetLat - state.latitude) * (Math.PI / 180);
      const dLng = (targetLng - state.longitude) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(state.latitude * (Math.PI / 180)) *
          Math.cos(targetLat * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [state.latitude, state.longitude]
  );

  return {
    ...state,
    calculateDistance,
  };
};
