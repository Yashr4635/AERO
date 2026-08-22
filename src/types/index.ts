/* ============================================================
   AERO — Shared TypeScript Types
   ============================================================ */

// ── User & Auth ──
export type UserRole = 'AMBULANCE' | 'POLICE' | 'HOSPITAL' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  badgeNumber?: string;
  vehicleNumber?: string;
  hospitalId?: string;
  policeStation?: string;
}

// ── Emergency & Triage ──
export type EmergencyStatus = 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type EmergencyPriority = 'CODE_RED' | 'CODE_AMBER' | 'CODE_YELLOW';
export type EmergencyCategory = 'CARDIAC' | 'TRAUMA' | 'STROKE' | 'RESPIRATORY' | 'OBSTETRIC' | 'PEDIATRIC' | 'GENERAL';

export interface PatientVitals {
  heartRate: number; // bpm
  bloodPressure: string; // e.g. "135/88"
  spo2: number; // %
  respiratoryRate: number; // breaths/min
  gcsScore: number; // Glasgow Coma Scale 3-15
}

export interface PatientInfo {
  name?: string;
  age?: number;
  gender?: 'M' | 'F' | 'Other';
  category: EmergencyCategory;
  priority: EmergencyPriority;
  chiefComplaint: string;
  vitals: PatientVitals;
  paramedicNotes?: string;
  leadDoctorAssigned?: string;
}

export interface HospitalPreparationState {
  traumaBayReady: boolean;
  icuBedReserved: boolean;
  otStandby: boolean;
  bloodReady: boolean;
  specialistAlerted: boolean;
}

export interface Emergency {
  id: string;
  status: EmergencyStatus;
  priority?: EmergencyPriority;
  category?: EmergencyCategory;
  ambulanceId: string;
  ambulanceDisplayName: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  hospital: Hospital;
  route?: RouteInfo;
  patient?: PatientInfo;
  hospitalPrep?: HospitalPreparationState;
  acceptedBy?: {
    id: string;
    displayName: string;
    badgeNumber: string;
    station?: string;
  };
  notes?: string;
  currentSpeedKmH?: number;
  distanceCoveredKm?: number;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

// ── Hospital ──
export interface Hospital {
  id: string;
  name: string;
  address: string;
  location: LatLng;
  phone?: string;
  emergencyCapable: boolean;
  totalBeds?: number;
  availableIcuBeds?: number;
  traumaBaysAvailable?: number;
  doctorsOnDuty?: number;
  distanceKm?: number;
}

// ── Junction & Police-Assisted Clearance ──
export type JunctionStatus = 'NORMAL' | 'PREPARING' | 'CLEARED' | 'PASSED';

export interface Junction {
  id: string;
  name: string;
  location: LatLng;
  assignedPoliceId?: string;
  assignedPoliceName?: string;
  status: JunctionStatus;
  distanceFromAmbulanceMeters?: number;
  etaSeconds?: number;
  clearedAt?: string;
}

// ── Traffic Incidents & Overlays ──
export type IncidentType = 'ACCIDENT' | 'ROAD_BLOCKAGE' | 'CONGESTION' | 'CONSTRUCTION' | 'WATERLOGGING';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TrafficIncident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location: LatLng;
  reportedBy: string;
  reportedAt: string;
  active: boolean;
}

export type CongestionLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface CongestionSegment {
  polyline: [number, number][];
  level: CongestionLevel;
  speedLimitKmH: number;
  averageSpeedKmH: number;
}

// ── Location & Telemetry ──
export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  deviceTimestamp: string;
}

// ── Route ──
export interface RouteInfo {
  polyline: [number, number][];
  distanceMeters: number;
  etaSeconds: number;
  waypoints?: LatLng[];
  junctions?: Junction[];
  congestionSegments?: CongestionSegment[];
}

// ── Police Handover / Coordination Note ──
export interface PoliceCoordinationMessage {
  id: string;
  emergencyId: string;
  fromOfficerId: string;
  fromOfficerName: string;
  toJunctionId: string;
  toJunctionName: string;
  message: string;
  timestamp: string;
}

// ── Connection State ──
export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';
export type GPSState = 'acquiring' | 'active' | 'unavailable';
export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'BUSY';

// ── UI Variants ──
export type ButtonVariant = 'primary' | 'emergency' | 'success' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'emergency';
export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'emergency';
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
