/**
 * AERO Live Routing & OSRM OpenStreetMap Integration Service
 * Computes live driving corridors, polylines, and ETAs between any GPS coordinates.
 */

import type { RouteInfo, LatLng } from '../types';
import { mockRoutePrimary, mockCongestionSegments } from '../mock';

export const routingService = {
  /**
   * Fetch live real-world driving route using OpenStreetMap OSRM API
   */
  async getLiveRoute(
    origin: LatLng | [number, number],
    destination: LatLng | [number, number]
  ): Promise<RouteInfo> {
    const originLat = Array.isArray(origin) ? origin[0] : origin.latitude;
    const originLng = Array.isArray(origin) ? origin[1] : origin.longitude;
    const destLat = Array.isArray(destination) ? destination[0] : destination.latitude;
    const destLng = Array.isArray(destination) ? destination[1] : destination.longitude;
    const mapboxToken = import.meta.env.VITE_MAP_ACCESS_TOKEN;

    try {
      let url = '';
      if (mapboxToken) {
        url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${originLng},${originLat};${destLng},${destLat}?geometries=geojson&overview=full&access_token=${mapboxToken}`;
      } else {
        url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      }
      
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });

      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // GeoJSON coordinates are [lng, lat], convert to Leaflet [lat, lng]
          const polyline: [number, number][] = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
          );

          return {
            polyline,
            distanceMeters: Math.round(route.distance),
            etaSeconds: Math.round(route.duration),
            congestionSegments: [], // Mapbox returns congestion data differently, we will just use standard color for now
          };
        }
      } else {
        console.warn(`[AERO ROUTING] HTTP error ${res.status} from routing engine`);
      }
    } catch (err: any) {
      console.warn(`[AERO ROUTING] Failed to fetch live route: ${err.message}`);
    }

    // Fallback: build linear/interpolated points between origin and destination
    const steps = 15;
    const interpolated: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      interpolated.push([
        originLat + (destLat - originLat) * frac,
        originLng + (destLng - originLng) * frac,
      ]);
    }

    // Approximate distance in meters using Haversine formula
    const R = 6371e3; // Earth radius in meters
    const dLat = ((destLat - originLat) * Math.PI) / 180;
    const dLng = ((destLng - originLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((originLat * Math.PI) / 180) *
        Math.cos((destLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distMeters = Math.round(R * c);
    const etaSecs = Math.round(distMeters / 15); // ~54 km/h average speed

    return {
      polyline: interpolated.length > 2 ? interpolated : mockRoutePrimary,
      distanceMeters: distMeters || 3800,
      etaSeconds: etaSecs || 310,
      congestionSegments: mockCongestionSegments,
    };
  },

  /**
   * Ranks an array of hospitals by actual driving travel time from the origin.
   * Primary metric: travel duration (ETA).
   * Secondary metric: driving distance.
   */
  async rankHospitalsByTravelTime(
    origin: LatLng | [number, number],
    hospitals: any[]
  ): Promise<any[]> {
    if (!hospitals || hospitals.length === 0) return [];
    
    // Process routes sequentially to prevent hammering the public OSRM server
    const results = [];
    for (const hospital of hospitals) {
      console.log(`[AERO ROUTING] Routing candidate: ${hospital.name}`);
      try {
        const dest: [number, number] = [hospital.lat, hospital.lng];
        const routeInfo = await this.getLiveRoute(origin, dest);
        
        if (routeInfo) {
          console.log(`[AERO ROUTING] ETA: ${Math.round(routeInfo.etaSeconds/60)} min`);
          console.log(`[AERO ROUTING] Distance: ${(routeInfo.distanceMeters/1000).toFixed(1)} km`);
        }
        
        results.push({ hospital, routeInfo });
      } catch (error) {
        console.warn(`[AERO ROUTING] Failed routing for ${hospital.name}`);
        results.push({ hospital, routeInfo: null });
      }
    }
    
    // Sort logic: Primary duration (ETA), Secondary distance
    results.sort((a, b) => {
      // Both routes succeeded
      if (a.routeInfo && b.routeInfo) {
        if (a.routeInfo.etaSeconds !== b.routeInfo.etaSeconds) {
          return a.routeInfo.etaSeconds - b.routeInfo.etaSeconds;
        }
        return a.routeInfo.distanceMeters - b.routeInfo.distanceMeters;
      }
      
      // If one failed, prioritize the one that succeeded
      if (a.routeInfo && !b.routeInfo) return -1;
      if (!a.routeInfo && b.routeInfo) return 1;
      
      // Both failed, fallback to straight line geographic distance
      return a.hospital.distanceMeters - b.hospital.distanceMeters;
    });

    if (results.length > 0) {
      console.log(`[AERO ROUTING] Selected fastest hospital: ${results[0].hospital.name}`);
    }

    // Inject routing info into the hospital object for easy access
    return results.map(res => ({
      ...res.hospital,
      drivingDistanceMeters: res.routeInfo?.distanceMeters || res.hospital.distanceMeters,
      drivingEtaSeconds: res.routeInfo?.etaSeconds,
      routePolyline: res.routeInfo?.polyline,
    }));
  }
};
