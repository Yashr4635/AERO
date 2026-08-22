/**
 * Nearest Hospital Finder
 * Computes Haversine distance from a given GPS position to all
 * emergency-capable hospitals and returns the closest available one.
 */

import type { Hospital } from '../types';

/** Haversine great-circle distance in metres */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface HospitalWithDistance extends Hospital {
  /** Straight-line distance from the given position in metres */
  distanceFromUserMeters: number;
  /** Human-readable distance string (km or m) */
  distanceLabel: string;
}

/**
 * Rank all emergency-capable hospitals by straight-line distance from userPos.
 */
export function rankHospitalsByDistance(
  userPos: [number, number],
  hospitals: Hospital[],
): HospitalWithDistance[] {
  return hospitals
    .filter((h) => h.emergencyCapable)
    .map((h) => {
      const meters = haversineDistance(
        userPos[0], userPos[1],
        h.location.latitude, h.location.longitude,
      );
      const distanceLabel =
        meters >= 1000
          ? `${(meters / 1000).toFixed(1)} km`
          : `${Math.round(meters)} m`;
      return { ...h, distanceFromUserMeters: meters, distanceLabel };
    })
    .sort((a, b) => a.distanceFromUserMeters - b.distanceFromUserMeters);
}

/**
 * Return the single nearest emergency-capable hospital with beds available.
 */
export function getNearestHospital(
  userPos: [number, number],
  hospitals: Hospital[],
): HospitalWithDistance | null {
  const ranked = rankHospitalsByDistance(userPos, hospitals);
  if (ranked.length === 0) return null;
  const withBeds = ranked.filter((h) => (h.availableIcuBeds ?? 0) > 0);
  return withBeds.length > 0 ? withBeds[0] : ranked[0];
}
