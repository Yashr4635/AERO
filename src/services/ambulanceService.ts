import { mockAmbulances } from '../mock';
import { supabase } from '../lib/supabase';
import { realtimeService } from './realtimeService';
import { routingService } from './routingService';
import type { Emergency, Hospital, PatientInfo, TrafficIncident } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ambulanceService = {
  async getAmbulanceState(ambulanceId: string) {
    await delay(200);
    return mockAmbulances.find(a => a.id === ambulanceId) || mockAmbulances[0];
  },

  /**
   * Request SOS — takes full Hospital object so it works with both mock
   * and live OSM hospitals. hospitalId + hospitalObj must be consistent.
   */
  async requestSOS(
    ambulanceId: string,
    hospital: Hospital,                  // ← full object, not just ID
    patientData?: Partial<PatientInfo>,
    currentPos?: [number, number],
  ): Promise<Emergency> {
    const ambulance = mockAmbulances.find(a => a.id === ambulanceId) || mockAmbulances[0];
    const startPos = currentPos || ambulance.position;

    // Compute live OSRM driving route from current GPS to chosen hospital
    const routeInfo = await routingService.getLiveRoute(startPos, [
      hospital.location.latitude,
      hospital.location.longitude,
    ]);

    const newEmergency: Emergency = {
      id: `EMG-${Math.floor(1000 + Math.random() * 9000)}`, // Local ID for UI logic temporarily
      status: 'ACTIVE',
      priority: patientData?.priority || 'CODE_RED',
      category: patientData?.category || 'CARDIAC',
      ambulanceId: ambulance.id,
      ambulanceDisplayName: ambulance.name,
      vehicleNumber: ambulance.vehicleNumber,
      driverName: ambulance.driverName,
      driverPhone: ambulance.driverPhone,
      hospital,
      currentSpeedKmH: 54,
      distanceCoveredKm: 0,
      createdAt: new Date().toISOString(),
      route: {
        polyline: routeInfo.polyline,
        distanceMeters: routeInfo.distanceMeters,
        etaSeconds: routeInfo.etaSeconds,
        junctions: realtimeService.getJunctions(),
        congestionSegments: routeInfo.congestionSegments,
      },
      patient: {
        name: patientData?.name || 'Emergency Patient',
        age: patientData?.age || 45,
        gender: patientData?.gender || 'M',
        category: patientData?.category || 'CARDIAC',
        priority: patientData?.priority || 'CODE_RED',
        chiefComplaint: patientData?.chiefComplaint || 'Acute emergency, unstable vitals',
        vitals: patientData?.vitals || {
          heartRate: 114,
          bloodPressure: '152/94',
          spo2: 92,
          respiratoryRate: 22,
          gcsScore: 14,
        },
        paramedicNotes: patientData?.paramedicNotes || 'Patient loaded. Oxygen administered.',
        leadDoctorAssigned: 'ER Duty Team',
      },
      hospitalPrep: {
        traumaBayReady: false,
        icuBedReserved: false,
        otStandby: false,
        bloodReady: false,
        specialistAlerted: true,
      },
    };

    // Supabase Persistence
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const priorityMapping: Record<string, string> = {
        'CODE_RED': 'critical',
        'CODE_YELLOW': 'high',
        'CODE_GREEN': 'medium',
      };
      const pgPriority = priorityMapping[newEmergency.priority as string] || 'critical';
      
      const { data, error } = await supabase.from('emergency_incidents').insert({
        user_id: user.id,
        incident_type: newEmergency.category,
        priority: pgPriority,
        status: 'active',
        ambulance_id: newEmergency.ambulanceId,
        latitude: startPos[0],
        longitude: startPos[1],
        destination_hospital: hospital.name,
        destination_latitude: hospital.location.latitude,
        destination_longitude: hospital.location.longitude,
        eta_minutes: Math.round((routeInfo.etaSeconds || 300) / 60),
        route_geometry: routeInfo.polyline,
        route_distance_meters: routeInfo.distanceMeters,
        route_duration_seconds: routeInfo.etaSeconds,
        current_latitude: startPos[0],
        current_longitude: startPos[1],
        current_speed: 0,
        description: newEmergency.patient?.chiefComplaint || 'Emergency Request'
      }).select().single();
      
      if (error || !data) {
        console.error('Supabase insert failed:', error);
      } else {
        newEmergency.id = data.id;
      }
    } else {
      console.warn('User not authenticated, skipping DB persistence for prototype demo.');
    }

    return newEmergency;
  },

  async updateEmergencyLocation(
    incidentId: string,
    currentPos: [number, number],
    speedKmH: number | null,
    destination: [number, number],
    shouldRecalculateRoute: boolean
  ) {
    let updates: any = {
      current_latitude: currentPos[0],
      current_longitude: currentPos[1],
      current_speed: speedKmH || 0,
      updated_at: new Date().toISOString()
    };

    if (shouldRecalculateRoute) {
      try {
        const routeInfo = await routingService.getLiveRoute(currentPos, destination);
        updates.route_geometry = routeInfo.polyline;
        updates.route_distance_meters = routeInfo.distanceMeters;
        updates.route_duration_seconds = routeInfo.etaSeconds;
        updates.eta_minutes = Math.round((routeInfo.etaSeconds || 300) / 60);
      } catch (e) {
        console.error("Failed to recalculate route during GPS update", e);
      }
    }

    const { error } = await supabase
      .from('emergency_incidents')
      .update(updates)
      .eq('id', incidentId);
      
    if (error) {
      console.error('Failed to update emergency location in Supabase', error);
    }
  },

  async triggerReroute(emergencyId: string, alternateHospital?: Hospital): Promise<Emergency> {
    await delay(300);
    const active = realtimeService.getActiveEmergency();
    if (!active || active.id !== emergencyId) throw new Error('Emergency not found');

    const targetHospital = alternateHospital || active.hospital;
    const currentPos = active.route?.polyline?.[0] || [active.hospital.location.latitude, active.hospital.location.longitude];

    const routeInfo = await routingService.getLiveRoute(currentPos, [
      targetHospital.location.latitude,
      targetHospital.location.longitude,
    ]);

    const updated: Emergency = {
      ...active,
      hospital: targetHospital,
      route: {
        ...active.route!,
        polyline: routeInfo.polyline,
        distanceMeters: routeInfo.distanceMeters,
        etaSeconds: routeInfo.etaSeconds,
      },
      notes: 'Rerouted via live OSRM corridor.',
    };

    // Update in Supabase
    await supabase.from('emergency_incidents').update({
      destination_hospital: targetHospital.name,
      destination_latitude: targetHospital.location.latitude,
      destination_longitude: targetHospital.location.longitude,
      route_geometry: routeInfo.polyline,
      route_distance_meters: routeInfo.distanceMeters,
      route_duration_seconds: routeInfo.etaSeconds,
      eta_minutes: Math.round((routeInfo.etaSeconds || 300) / 60),
    }).eq('id', emergencyId);

    realtimeService.triggerEmergency(updated);
    return updated;
  },

  async reportIncident(incident: Omit<TrafficIncident, 'id' | 'reportedAt' | 'active'>): Promise<TrafficIncident> {
    await delay(200);
    const newIncident: TrafficIncident = {
      ...incident,
      id: `INC-${Math.floor(100 + Math.random() * 900)}`,
      reportedAt: new Date().toISOString(),
      active: true,
    };
    realtimeService.reportIncident(newIncident);
    return newIncident;
  },

  async cancelSOS(emergencyId: string) {
    await supabase.from('emergency_incidents').update({ status: 'cancelled' }).eq('id', emergencyId);
    realtimeService.updateEmergencyStatus(emergencyId, 'CANCELLED');
    return { success: true };
  },

  async completeSOS(emergencyId: string) {
    await supabase.from('emergency_incidents').update({ status: 'completed' }).eq('id', emergencyId);
    realtimeService.updateEmergencyStatus(emergencyId, 'COMPLETED');
    return { success: true };
  },
};
