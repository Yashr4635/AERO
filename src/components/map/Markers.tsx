import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { JunctionStatus, IncidentSeverity, AvailabilityStatus } from '../../types';

/* ── Ambulance Marker ── */
interface AmbulanceMarkerProps {
  position: [number, number];
  heading?: number;
  label?: string;
  speedKmH?: number;
  vehicleNumber?: string;
  isSOS?: boolean;
}

function createAmbulanceIcon(heading: number = 0, isSOS: boolean = true) {
  const pulseHtml = isSOS ? `<div class="ambulance-pulse-ring"></div>` : '';
  const svgHtml = `
    <div class="relative flex items-center justify-center" style="width: 44px; height: 44px;">
      ${pulseHtml}
      <div style="transform: rotate(${heading}deg); transition: transform 0.3s ease;">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#ffffff" stroke="#ef4444" stroke-width="2.5"/>
          <circle cx="20" cy="20" r="13" fill="#ef4444" fill-opacity="0.2"/>
          <path d="M20 7L27 24L20 20L13 24L20 7Z" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
          <circle cx="20" cy="20" r="3" fill="#ef4444"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'aero-marker-ambulance',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

export function AmbulanceMarker({
  position,
  heading = 0,
  label = 'Ambulance',
  speedKmH,
  vehicleNumber,
  isSOS = true,
}: AmbulanceMarkerProps) {
  return (
    <Marker position={position} icon={createAmbulanceIcon(heading, isSOS)}>
      <Popup className="aero-custom-popup">
        <div className="p-1 min-w-[160px]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Emergency Unit
          </div>
          <p className="font-bold text-sm text-slate-900 mt-1">{label}</p>
          {vehicleNumber && <p className="text-xs text-slate-500 font-mono">{vehicleNumber}</p>}
          {speedKmH !== undefined && (
            <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-xs">
              <span className="text-slate-500">Live Speed:</span>
              <span className="font-bold text-slate-800">{speedKmH} km/h</span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

/* ── Hospital Marker ── */
interface HospitalMarkerProps {
  position: [number, number];
  name: string;
  address?: string;
  availableIcuBeds?: number;
  traumaBaysAvailable?: number;
  phone?: string;
}

function createHospitalIcon() {
  const svg = `
    <div class="flex items-center justify-center filter drop-shadow-md">
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 41C17 41 32 25 32 15C32 6.71573 25.2843 0 17 0C8.71573 0 2 6.71573 2 15C2 25 17 41 17 41Z" fill="#dc2626" stroke="#ffffff" stroke-width="1.5"/>
        <rect x="11" y="8" width="12" height="14" rx="2" fill="#ffffff"/>
        <rect x="15" y="10" width="4" height="10" fill="#dc2626"/>
        <rect x="12" y="13" width="10" height="4" fill="#dc2626"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svg,
    className: 'aero-marker-hospital',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -42],
  });
}

export function HospitalMarker({
  position,
  name,
  address,
  availableIcuBeds,
  traumaBaysAvailable,
  phone,
}: HospitalMarkerProps) {
  return (
    <Marker position={position} icon={createHospitalIcon()}>
      <Popup className="aero-custom-popup">
        <div className="p-1 min-w-[180px]">
          <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Hospital ER</div>
          <p className="font-bold text-sm text-slate-900 mt-0.5">{name}</p>
          {address && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{address}</p>}
          {(availableIcuBeds !== undefined || traumaBaysAvailable !== undefined) && (
            <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-2 gap-1 text-[11px]">
              {availableIcuBeds !== undefined && (
                <div className="bg-slate-100 p-1 rounded text-center">
                  <span className="text-slate-500 block text-[9px]">ICU Beds</span>
                  <span className="font-bold text-emerald-700">{availableIcuBeds} Open</span>
                </div>
              )}
              {traumaBaysAvailable !== undefined && (
                <div className="bg-slate-100 p-1 rounded text-center">
                  <span className="text-slate-500 block text-[9px]">Trauma Bay</span>
                  <span className="font-bold text-blue-700">{traumaBaysAvailable} Ready</span>
                </div>
              )}
            </div>
          )}
          {phone && (
            <div className="mt-1.5 text-[11px] text-slate-600 flex items-center gap-1">
              <span>📞 {phone}</span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

/* ── Junction Marker (Traffic Light / Checkpoint) ── */
interface JunctionMarkerProps {
  position: [number, number];
  name: string;
  status: JunctionStatus;
  distanceMeters?: number;
  policeName?: string;
}

function createJunctionIcon(status: JunctionStatus) {
  let bgColor = '#64748b'; // Normal (slate)
  let ringColor = '#94a3b8';
  let badgeText = 'NORM';

  if (status === 'PREPARING') {
    bgColor = '#f59e0b'; // Amber
    ringColor = '#fbbf24';
    badgeText = 'PREP';
  } else if (status === 'CLEARED') {
    bgColor = '#10b981'; // Green
    ringColor = '#34d399';
    badgeText = 'CLEAR';
  } else if (status === 'PASSED') {
    bgColor = '#0284c7'; // Blue
    ringColor = '#38bdf8';
    badgeText = 'DONE';
  }

  const svg = `
    <div class="relative flex items-center justify-center">
      <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${bgColor}; border: 2.5px solid #ffffff; box-shadow: 0 0 10px ${ringColor}; display: flex; align-items: center; justify-content: center;">
        <span style="color: #ffffff; font-size: 8px; font-weight: 800; font-family: sans-serif; letter-spacing: -0.5px;">${badgeText}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svg,
    className: 'aero-marker-junction',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

export function JunctionMarker({
  position,
  name,
  status,
  distanceMeters,
  policeName,
}: JunctionMarkerProps) {
  const statusLabel = {
    NORMAL: 'Normal Flow',
    PREPARING: 'Preparing Green Wave',
    CLEARED: 'Corridor Cleared',
    PASSED: 'Ambulance Passed',
  }[status];

  return (
    <Marker position={position} icon={createJunctionIcon(status)}>
      <Popup className="aero-custom-popup">
        <div className="p-1 min-w-[170px]">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Traffic Checkpoint</div>
          <p className="font-bold text-sm text-slate-900 mt-0.5">{name}</p>
          <div className="mt-2 pt-2 border-t border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-slate-800">{statusLabel}</span>
            </div>
            {distanceMeters !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Ambulance Dist:</span>
                <span className="font-bold text-slate-800">{distanceMeters}m</span>
              </div>
            )}
            {policeName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Officer:</span>
                <span className="font-medium text-slate-700">{policeName}</span>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

/* ── Police Unit Marker ── */
interface PoliceMarkerProps {
  position: [number, number];
  name: string;
  station?: string;
  badgeNumber?: string;
  availability?: AvailabilityStatus;
}

function createPoliceIcon(availability: AvailabilityStatus = 'AVAILABLE') {
  const isAvailable = availability === 'AVAILABLE';
  const color = isAvailable ? '#0284c7' : '#eab308';

  const svg = `
    <div class="flex items-center justify-center filter drop-shadow-md">
      <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 38C16 38 30 24 30 14C30 6.26801 23.732 0 16 0C8.26801 0 2 6.26801 2 14C2 24 16 38 16 38Z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
        <path d="M16 7L18.5 12L24 12.8L20 16.7L21 22.2L16 19.5L11 22.2L12 16.7L8 12.8L13.5 12L16 7Z" fill="#ffffff"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svg,
    className: 'aero-marker-police',
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38],
  });
}

export function PoliceMarker({
  position,
  name,
  station,
  badgeNumber,
  availability = 'AVAILABLE',
}: PoliceMarkerProps) {
  return (
    <Marker position={position} icon={createPoliceIcon(availability)}>
      <Popup className="aero-custom-popup">
        <div className="p-1 min-w-[160px]">
          <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Traffic Police Post</div>
          <p className="font-bold text-sm text-slate-900 mt-0.5">{name}</p>
          {badgeNumber && <p className="text-xs text-slate-500 font-mono">Badge: {badgeNumber}</p>}
          {station && <p className="text-[11px] text-slate-600 mt-1">{station}</p>}
          <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between text-xs">
            <span className="text-slate-500">Status:</span>
            <span className={`font-semibold ${availability === 'AVAILABLE' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {availability}
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

/* ── Incident Marker (Accident / Hazard / Road Blockage) ── */
interface IncidentMarkerProps {
  position: [number, number];
  title: string;
  description: string;
  type: string;
  severity: IncidentSeverity;
  reportedBy?: string;
}

function createIncidentIcon() {
  const svg = `
    <div class="flex items-center justify-center filter drop-shadow-md">
      <div style="width: 28px; height: 28px; border-radius: 6px; background-color: #f97316; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center;">
        <span style="color: #ffffff; font-size: 14px;">⚠️</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svg,
    className: 'aero-marker-incident',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

export function IncidentMarker({
  position,
  title,
  description,
  type,
  severity,
  reportedBy,
}: IncidentMarkerProps) {
  return (
    <Marker position={position} icon={createIncidentIcon()}>
      <Popup className="aero-custom-popup">
        <div className="p-1 min-w-[180px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{type}</span>
            <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-bold">{severity}</span>
          </div>
          <p className="font-bold text-sm text-slate-900 mt-1">{title}</p>
          <p className="text-xs text-slate-600 mt-1">{description}</p>
          {reportedBy && (
            <p className="text-[10px] text-slate-400 mt-2 italic">Reported by: {reportedBy}</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
