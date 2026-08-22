import type {
  Emergency,
  Hospital,
  Junction,
  TrafficIncident,
  CongestionSegment,
  ConnectionState,
  GPSState,
  AvailabilityStatus,
} from '../types';

export interface Ambulance {
  id: string;
  name: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  position: [number, number];
  heading: number;
  speedKmH: number;
  fuelPercent: number;
  connectionState: ConnectionState;
  gpsState: GPSState;
  accuracy: number;
  status: 'AVAILABLE' | 'ON_CALL' | 'MAINTENANCE';
}

export interface PoliceUnit {
  id: string;
  name: string;
  badgeNumber: string;
  station: string;
  position: [number, number];
  assignedJunctionId?: string;
  availability: AvailabilityStatus;
  connectionState: ConnectionState;
  phone: string;
}

// ── Mock Hospitals ──
export const mockHospitals: Hospital[] = [
  {
    id: 'HOSP-001',
    name: 'Victoria Central Trauma Care',
    address: 'Fort Road, Near City Market, Bengaluru 560002',
    location: { latitude: 12.9628, longitude: 77.5753 },
    phone: '+91 80 2670 1150',
    emergencyCapable: true,
    totalBeds: 250,
    availableIcuBeds: 6,
    traumaBaysAvailable: 3,
    doctorsOnDuty: 8,
    distanceKm: 3.4,
  },
  {
    id: 'HOSP-002',
    name: 'Bowring & Lady Curzon Emergency Wing',
    address: 'Lady Curzon Rd, Tasker Town, Shivajinagar, Bengaluru 560001',
    location: { latitude: 12.9835, longitude: 77.6025 },
    phone: '+91 80 2559 1325',
    emergencyCapable: true,
    totalBeds: 180,
    availableIcuBeds: 4,
    traumaBaysAvailable: 2,
    doctorsOnDuty: 6,
    distanceKm: 2.1,
  },
  {
    id: 'HOSP-003',
    name: 'Manipal Advanced Critical Care',
    address: '98 HAL Old Airport Rd, Kodihalli, Bengaluru 560017',
    location: { latitude: 12.9592, longitude: 77.6472 },
    phone: '+91 80 2502 4444',
    emergencyCapable: true,
    totalBeds: 320,
    availableIcuBeds: 9,
    traumaBaysAvailable: 5,
    doctorsOnDuty: 12,
    distanceKm: 6.8,
  },
  {
    id: 'HOSP-004',
    name: 'Apollo Hospital & Heart Center',
    address: '154/11 Bannerghatta Main Rd, Bengaluru 560076',
    location: { latitude: 12.8958, longitude: 77.5989 },
    phone: '+91 80 2630 4050',
    emergencyCapable: true,
    totalBeds: 210,
    availableIcuBeds: 5,
    traumaBaysAvailable: 2,
    doctorsOnDuty: 7,
    distanceKm: 8.5,
  },
];

// ── Mock Junctions (Traffic Clearance Checkpoints) ──
export const mockJunctions: Junction[] = [
  {
    id: 'JUNC-101',
    name: 'MG Road — Brigade Road Junction',
    location: { latitude: 12.9734, longitude: 77.6074 },
    assignedPoliceId: 'POL-001',
    assignedPoliceName: 'Insp. R. Sharma',
    status: 'PREPARING',
    distanceFromAmbulanceMeters: 850,
    etaSeconds: 90,
  },
  {
    id: 'JUNC-102',
    name: 'Trinity Circle Intersection',
    location: { latitude: 12.9726, longitude: 77.6200 },
    assignedPoliceId: 'POL-002',
    assignedPoliceName: 'SI P. Nair',
    status: 'NORMAL',
    distanceFromAmbulanceMeters: 2100,
    etaSeconds: 220,
  },
  {
    id: 'JUNC-103',
    name: 'Richmond Circle Flyover Approach',
    location: { latitude: 12.9645, longitude: 77.5980 },
    assignedPoliceId: 'POL-003',
    assignedPoliceName: 'HC K. Patel',
    status: 'CLEARED',
    distanceFromAmbulanceMeters: 450,
    etaSeconds: 45,
    clearedAt: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: 'JUNC-104',
    name: 'Mayo Hall Junction — Residency Rd',
    location: { latitude: 12.9748, longitude: 77.6092 },
    assignedPoliceId: 'POL-004',
    assignedPoliceName: 'Officer S. Rao',
    status: 'NORMAL',
    distanceFromAmbulanceMeters: 3200,
    etaSeconds: 340,
  },
  {
    id: 'JUNC-105',
    name: 'Hudson Circle — City Hall Gateway',
    location: { latitude: 12.9680, longitude: 77.5880 },
    assignedPoliceId: 'POL-001',
    assignedPoliceName: 'Insp. R. Sharma',
    status: 'PASSED',
    distanceFromAmbulanceMeters: 0,
    etaSeconds: 0,
    clearedAt: new Date(Date.now() - 8 * 60000).toISOString(),
  },
];

// ── Mock Traffic Incidents (Blockages / Accidents) ──
export const mockIncidents: TrafficIncident[] = [
  {
    id: 'INC-901',
    type: 'ACCIDENT',
    severity: 'HIGH',
    title: 'Two-Wheeler Collision',
    description: 'Accident blocking left lane near Trinity Metro station. Traffic slowed down.',
    location: { latitude: 12.9730, longitude: 77.6180 },
    reportedBy: 'SI P. Nair (Traffic Police)',
    reportedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    active: true,
  },
  {
    id: 'INC-902',
    type: 'ROAD_BLOCKAGE',
    severity: 'MEDIUM',
    title: 'Water Pipe Maintenance',
    description: 'BWSSB pipeline repair work occupying 1 lane near Residency Road.',
    location: { latitude: 12.9690, longitude: 77.6010 },
    reportedBy: 'Ambulance Unit 02',
    reportedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    active: true,
  },
];

// ── Mock Congestion Segments ──
export const mockCongestionSegments: CongestionSegment[] = [
  {
    polyline: [
      [12.9716, 77.5946],
      [12.9730, 77.5990],
      [12.9734, 77.6074],
    ],
    level: 'green',
    speedLimitKmH: 50,
    averageSpeedKmH: 48,
  },
  {
    polyline: [
      [12.9734, 77.6074],
      [12.9740, 77.6120],
      [12.9726, 77.6200],
    ],
    level: 'orange',
    speedLimitKmH: 50,
    averageSpeedKmH: 22,
  },
  {
    polyline: [
      [12.9645, 77.5980],
      [12.9628, 77.5753],
    ],
    level: 'yellow',
    speedLimitKmH: 40,
    averageSpeedKmH: 32,
  },
];

// ── Mock Ambulances ──
export const mockAmbulances: Ambulance[] = [
  {
    id: 'AMB-001',
    name: 'LifeCare Alpha (ALS Unit)',
    vehicleNumber: 'KA-01-EA-1008',
    driverName: 'Vikram Joshi',
    driverPhone: '+91 98450 12345',
    position: [12.9716, 77.5946],
    heading: 315,
    speedKmH: 54,
    fuelPercent: 88,
    connectionState: 'connected',
    gpsState: 'active',
    accuracy: 4,
    status: 'ON_CALL',
  },
  {
    id: 'AMB-002',
    name: 'Metro Rescue Bravo (BLS Unit)',
    vehicleNumber: 'KA-04-AM-2022',
    driverName: 'Mohan Kumar',
    driverPhone: '+91 98452 67890',
    position: [12.9800, 77.6150],
    heading: 90,
    speedKmH: 0,
    fuelPercent: 92,
    connectionState: 'connected',
    gpsState: 'active',
    accuracy: 6,
    status: 'AVAILABLE',
  },
  {
    id: 'AMB-003',
    name: 'Cardiac Express Charlie (MICU)',
    vehicleNumber: 'KA-05-EM-9911',
    driverName: 'Abdul Rahman',
    driverPhone: '+91 97411 33221',
    position: [12.9550, 77.5850],
    heading: 180,
    speedKmH: 62,
    fuelPercent: 74,
    connectionState: 'connected',
    gpsState: 'active',
    accuracy: 5,
    status: 'ON_CALL',
  },
  {
    id: 'AMB-004',
    name: 'Trauma Unit Delta',
    vehicleNumber: 'KA-02-LS-4400',
    driverName: 'Suresh Gowda',
    driverPhone: '+91 99001 88776',
    position: [12.9400, 77.6200],
    heading: 270,
    speedKmH: 0,
    fuelPercent: 65,
    connectionState: 'disconnected',
    gpsState: 'unavailable',
    accuracy: 0,
    status: 'MAINTENANCE',
  },
];

// ── Mock Police Units ──
export const mockPoliceUnits: PoliceUnit[] = [
  {
    id: 'POL-001',
    name: 'Insp. R. Sharma',
    badgeNumber: 'B-4091',
    station: 'Cubbon Park Traffic Police Station',
    position: [12.9734, 77.6074],
    assignedJunctionId: 'JUNC-101',
    availability: 'BUSY',
    connectionState: 'connected',
    phone: '+91 94498 11001',
  },
  {
    id: 'POL-002',
    name: 'SI P. Nair',
    badgeNumber: 'B-3180',
    station: 'Ulsoor Traffic Police Station',
    position: [12.9726, 77.6200],
    assignedJunctionId: 'JUNC-102',
    availability: 'AVAILABLE',
    connectionState: 'connected',
    phone: '+91 94498 11002',
  },
  {
    id: 'POL-003',
    name: 'HC K. Patel',
    badgeNumber: 'B-5520',
    station: 'Ashoknagar Traffic Police Station',
    position: [12.9645, 77.5980],
    assignedJunctionId: 'JUNC-103',
    availability: 'AVAILABLE',
    connectionState: 'connected',
    phone: '+91 94498 11003',
  },
  {
    id: 'POL-004',
    name: 'Officer S. Rao',
    badgeNumber: 'B-6214',
    station: 'Shivajinagar Traffic Police Station',
    position: [12.9748, 77.6092],
    assignedJunctionId: 'JUNC-104',
    availability: 'AVAILABLE',
    connectionState: 'connected',
    phone: '+91 94498 11004',
  },
];

// ── Mock Polyline Routes ──
export const mockRoutePrimary: [number, number][] = [
  [12.9716, 77.5946],
  [12.9722, 77.5980],
  [12.9728, 77.6020],
  [12.9734, 77.6074], // Junction JUNC-101
  [12.9745, 77.6085],
  [12.9780, 77.6050],
  [12.9810, 77.6035],
  [12.9835, 77.6025], // Hospital HOSP-002
];

export const mockRouteAlternate: [number, number][] = [
  [12.9716, 77.5946],
  [12.9690, 77.5910],
  [12.9660, 77.5850],
  [12.9640, 77.5800],
  [12.9628, 77.5753], // Hospital HOSP-001
];

// ── Mock Emergencies ──
export const mockEmergencies: Emergency[] = [
  {
    id: 'EMG-1024',
    status: 'ACTIVE',
    priority: 'CODE_RED',
    category: 'CARDIAC',
    ambulanceId: 'AMB-001',
    ambulanceDisplayName: 'LifeCare Alpha (ALS Unit)',
    vehicleNumber: 'KA-01-EA-1008',
    driverName: 'Vikram Joshi',
    driverPhone: '+91 98450 12345',
    hospital: mockHospitals[1], // Bowring & Lady Curzon
    currentSpeedKmH: 54,
    distanceCoveredKm: 1.8,
    route: {
      polyline: mockRoutePrimary,
      distanceMeters: 3800,
      etaSeconds: 310, // ~5.1 mins
      junctions: [mockJunctions[0], mockJunctions[3]],
      congestionSegments: mockCongestionSegments,
    },
    patient: {
      name: 'Ramesh Sundaram',
      age: 58,
      gender: 'M',
      category: 'CARDIAC',
      priority: 'CODE_RED',
      chiefComplaint: 'Acute ST-Elevation Myocardial Infarction (STEMI), severe chest pain & diaphoresis',
      vitals: {
        heartRate: 118,
        bloodPressure: '158/96',
        spo2: 91,
        respiratoryRate: 24,
        gcsScore: 14,
      },
      paramedicNotes: 'Aspirin 325mg administered sublingually. IV line established with normal saline. Oxygen 4L/min via cannula. 12-lead ECG confirmed anterior STEMI.',
      leadDoctorAssigned: 'Dr. Ananya Sen (Interventional Cardiologist)',
    },
    hospitalPrep: {
      traumaBayReady: true,
      icuBedReserved: true,
      otStandby: true,
      bloodReady: true,
      specialistAlerted: true,
    },
    acceptedBy: {
      id: 'POL-001',
      displayName: 'Insp. R. Sharma',
      badgeNumber: 'B-4091',
      station: 'Cubbon Park Traffic Station',
    },
    notes: 'Green corridor clearance actively maintained along MG Road corridor.',
    createdAt: new Date(Date.now() - 6 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'EMG-1025',
    status: 'ACCEPTED',
    priority: 'CODE_AMBER',
    category: 'TRAUMA',
    ambulanceId: 'AMB-003',
    ambulanceDisplayName: 'Cardiac Express Charlie',
    vehicleNumber: 'KA-05-EM-9911',
    driverName: 'Abdul Rahman',
    driverPhone: '+91 97411 33221',
    hospital: mockHospitals[0], // Victoria Central Trauma Care
    currentSpeedKmH: 48,
    distanceCoveredKm: 0.9,
    route: {
      polyline: mockRouteAlternate,
      distanceMeters: 4200,
      etaSeconds: 440,
      junctions: [mockJunctions[2], mockJunctions[4]],
    },
    patient: {
      name: 'Sunita Rao',
      age: 32,
      gender: 'F',
      category: 'TRAUMA',
      priority: 'CODE_AMBER',
      chiefComplaint: 'Motor vehicle accident, blunt abdominal trauma, closed fracture right femur',
      vitals: {
        heartRate: 104,
        bloodPressure: '110/72',
        spo2: 97,
        respiratoryRate: 18,
        gcsScore: 15,
      },
      paramedicNotes: 'C-spine immobilized. Thomas splint applied. Analgesic administered IV. Vitals stable.',
      leadDoctorAssigned: 'Dr. Vivek Menon (Trauma Surgeon)',
    },
    hospitalPrep: {
      traumaBayReady: true,
      icuBedReserved: false,
      otStandby: true,
      bloodReady: false,
      specialistAlerted: true,
    },
    acceptedBy: {
      id: 'POL-003',
      displayName: 'HC K. Patel',
      badgeNumber: 'B-5520',
      station: 'Ashoknagar Traffic Station',
    },
    notes: 'Approaching Richmond Circle flyover. Traffic clearance requested.',
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 1 * 60000).toISOString(),
  },
  {
    id: 'EMG-1020',
    status: 'COMPLETED',
    priority: 'CODE_RED',
    category: 'STROKE',
    ambulanceId: 'AMB-002',
    ambulanceDisplayName: 'Metro Rescue Bravo',
    vehicleNumber: 'KA-04-AM-2022',
    driverName: 'Mohan Kumar',
    hospital: mockHospitals[2],
    currentSpeedKmH: 0,
    distanceCoveredKm: 5.2,
    route: {
      polyline: mockRoutePrimary,
      distanceMeters: 5200,
      etaSeconds: 0,
    },
    patient: {
      name: 'Devraj Urs',
      age: 67,
      gender: 'M',
      category: 'STROKE',
      priority: 'CODE_RED',
      chiefComplaint: 'Acute ischemic stroke, right-sided hemiplegia, aphasia (onset < 90 mins)',
      vitals: {
        heartRate: 88,
        bloodPressure: '168/102',
        spo2: 96,
        respiratoryRate: 16,
        gcsScore: 11,
      },
    },
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 43 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
];

// ── Mock Historical Analytics Dataset ──
export const mockAnalyticsData = {
  overview: {
    totalEmergenciesToday: 18,
    activeEmergenciesCount: 2,
    avgResponseTimeMinutes: 7.2, // Target is < 8 min
    timeSavedVsNormalTrafficMins: 11.4,
    junctionClearanceSuccessRatePercent: 96.4,
    totalAmbulancesActive: 3,
    totalPoliceStationsLinked: 6,
  },
  emergencyVolume: [
    { time: '00:00 - 04:00', count: 3, clearedByPolice: 3 },
    { time: '04:00 - 08:00', count: 5, clearedByPolice: 5 },
    { time: '08:00 - 12:00', count: 12, clearedByPolice: 11 },
    { time: '12:00 - 16:00', count: 8, clearedByPolice: 8 },
    { time: '16:00 - 20:00', count: 14, clearedByPolice: 13 },
    { time: '20:00 - 24:00', count: 6, clearedByPolice: 6 },
  ],
  statusDistribution: [
    { name: 'Active Emergency', value: 2, fill: '#ef4444' }, // emergency-500
    { name: 'Accepted / En Route', value: 1, fill: '#f59e0b' }, // warning-500
    { name: 'Completed Today', value: 15, fill: '#10b981' }, // success-500
  ],
  categoryDistribution: [
    { name: 'Cardiac / STEMI', value: 6, fill: '#ef4444' },
    { name: 'Trauma & Accidents', value: 5, fill: '#f97316' },
    { name: 'Acute Stroke', value: 3, fill: '#8b5cf6' },
    { name: 'Severe Respiratory', value: 2, fill: '#06b6d4' },
    { name: 'Obstetric / Other', value: 2, fill: '#10b981' },
  ],
  responseTimes: [
    { day: 'Mon', avgResponseMins: 7.8, targetMins: 8.0, standardTrafficMins: 19.2 },
    { day: 'Tue', avgResponseMins: 7.1, targetMins: 8.0, standardTrafficMins: 18.5 },
    { day: 'Wed', avgResponseMins: 8.4, targetMins: 8.0, standardTrafficMins: 21.0 },
    { day: 'Thu', avgResponseMins: 6.9, targetMins: 8.0, standardTrafficMins: 17.8 },
    { day: 'Fri', avgResponseMins: 7.5, targetMins: 8.0, standardTrafficMins: 22.4 },
    { day: 'Sat', avgResponseMins: 5.8, targetMins: 8.0, standardTrafficMins: 15.0 },
    { day: 'Sun', avgResponseMins: 6.2, targetMins: 8.0, standardTrafficMins: 14.5 },
  ],
  junctionClearanceMetrics: [
    { junction: 'MG Road / Brigade', avgClearanceSecs: 38, count: 24, compliancePercent: 98 },
    { junction: 'Trinity Circle', avgClearanceSecs: 52, count: 19, compliancePercent: 94 },
    { junction: 'Richmond Circle', avgClearanceSecs: 41, count: 22, compliancePercent: 96 },
    { junction: 'Mayo Hall', avgClearanceSecs: 45, count: 16, compliancePercent: 95 },
    { junction: 'Hudson Circle', avgClearanceSecs: 35, count: 14, compliancePercent: 100 },
  ],
};
