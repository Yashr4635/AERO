import { Polyline } from 'react-leaflet';
import type { CongestionSegment } from '../../types';

interface RoutePolylineProps {
  positions: [number, number][];
  active?: boolean;
  congestionSegments?: CongestionSegment[];
}

export function RoutePolyline({
  positions,
  active = true,
  congestionSegments,
}: RoutePolylineProps) {
  if (!positions || positions.length < 2) return null;

  // Color mapping for traffic congestion
  const congestionColors: Record<string, string> = {
    green: '#10b981', // Smooth flow (40-60 km/h)
    yellow: '#eab308', // Moderate (25-40 km/h)
    orange: '#f97316', // Heavy (10-25 km/h)
    red: '#ef4444', // Gridlock (< 10 km/h)
  };

  return (
    <>
      {/* Outer Neon Glow Layer */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: active ? '#ef4444' : '#22c55e',
          weight: 10,
          opacity: active ? 0.3 : 0.15,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* Base Solid Route Line */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#1e293b',
          weight: 6,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* Render Congestion Segments if available */}
      {congestionSegments && congestionSegments.length > 0 ? (
        congestionSegments.map((segment, idx) => (
          <Polyline
            key={`congestion-${idx}`}
            positions={segment.polyline}
            pathOptions={{
              color: congestionColors[segment.level] || '#ef4444',
              weight: 4,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        ))
      ) : (
        /* Main Neon Line */
        <Polyline
          positions={positions}
          pathOptions={{
            color: active ? '#ef4444' : '#22c55e',
            weight: 4,
            opacity: active ? 0.95 : 0.8,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: active ? '8 8' : undefined,
            className: active ? 'animate-[dash_1s_linear_infinite]' : undefined,
          }}
        />
      )}

      {/* Pulsing Emergency Flow (Dashed Top Overlay) */}
      {active && (
        <Polyline
          positions={positions}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            opacity: 0.8,
            dashArray: '8 16',
            lineCap: 'round',
          }}
        />
      )}
    </>
  );
}
