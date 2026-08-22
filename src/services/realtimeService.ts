/**
 * AERO Real-Time Communication & Synchronization Engine
 * Uses BroadcastChannel API for instantaneous cross-tab/cross-window event delivery,
 * persistent shared operational state, and live WebSocket connectivity when online.
 */

import { mockJunctions, mockIncidents } from '../mock';
import type {
  Emergency,
  EmergencyStatus,
  Junction,
  JunctionStatus,
  TrafficIncident,
  HospitalPreparationState,
  PoliceCoordinationMessage,
  ConnectionState,
} from '../types';
import { audioAlert } from '../utils/audioAlert';

type EventHandler = (data: any) => void;

interface BroadcastPayload {
  event: string;
  data: any;
  timestamp: number;
  senderId: string;
}

const STORAGE_KEYS = {
  ACTIVE_EMERGENCY: 'aero_active_emergency',
  ALL_EMERGENCIES: 'aero_all_emergencies',
  JUNCTIONS: 'aero_junctions_state',
  INCIDENTS: 'aero_incidents_state',
  MESSAGES: 'aero_coordination_messages',
};

class RealtimeService {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private connectionState: ConnectionState = 'connected';
  private channel: BroadcastChannel | null = null;
  private instanceId: string = `client-${Math.random().toString(36).substring(2, 9)}`;

  // Operational State (Synced across tabs via localStorage + BroadcastChannel)
  private activeEmergencyState: Emergency | null = null;
  private emergenciesState: Emergency[] = [];
  private junctionsState: Junction[] = [...mockJunctions];
  private incidentsState: TrafficIncident[] = [...mockIncidents];
  private coordinationMessages: PoliceCoordinationMessage[] = [];

  constructor() {
    this.wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1/ws';
    this.loadPersistedState();
    this.initBroadcastChannel();
  }

  private loadPersistedState() {
    if (typeof window === 'undefined') return;

    try {
      const savedActive = localStorage.getItem(STORAGE_KEYS.ACTIVE_EMERGENCY);
      if (savedActive) {
        this.activeEmergencyState = JSON.parse(savedActive);
      }

      const savedEmergencies = localStorage.getItem(STORAGE_KEYS.ALL_EMERGENCIES);
      if (savedEmergencies) {
        this.emergenciesState = JSON.parse(savedEmergencies);
      } else if (this.activeEmergencyState) {
        this.emergenciesState = [this.activeEmergencyState];
      }

      const savedJunctions = localStorage.getItem(STORAGE_KEYS.JUNCTIONS);
      if (savedJunctions) {
        this.junctionsState = JSON.parse(savedJunctions);
      }

      const savedIncidents = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
      if (savedIncidents) {
        this.incidentsState = JSON.parse(savedIncidents);
      }

      const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (savedMessages) {
        this.coordinationMessages = JSON.parse(savedMessages);
      }
    } catch (e) {
      console.warn('Could not load stored emergency state:', e);
    }
  }

  private persistState() {
    if (typeof window === 'undefined') return;
    try {
      if (this.activeEmergencyState) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_EMERGENCY, JSON.stringify(this.activeEmergencyState));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_EMERGENCY);
      }
      localStorage.setItem(STORAGE_KEYS.ALL_EMERGENCIES, JSON.stringify(this.emergenciesState));
      localStorage.setItem(STORAGE_KEYS.JUNCTIONS, JSON.stringify(this.junctionsState));
      localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(this.incidentsState));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(this.coordinationMessages));
    } catch (e) {
      console.warn('Could not persist emergency state:', e);
    }
  }

  private initBroadcastChannel() {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    try {
      this.channel = new BroadcastChannel('aero_live_network');
      this.channel.onmessage = (event: MessageEvent<BroadcastPayload>) => {
        const payload = event.data;
        if (!payload || payload.senderId === this.instanceId) return;

        // Apply incoming synchronized data to local instance
        this.handleIncomingBroadcast(payload.event, payload.data);
      };
    } catch (e) {
      console.warn('BroadcastChannel initialization fallback:', e);
    }

    // Storage event fallback for cross-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.ACTIVE_EMERGENCY) {
        this.activeEmergencyState = e.newValue ? JSON.parse(e.newValue) : null;
        this.dispatchLocal('emergency_status', this.activeEmergencyState);
      }
      if (e.key === STORAGE_KEYS.JUNCTIONS && e.newValue) {
        this.junctionsState = JSON.parse(e.newValue);
        this.dispatchLocal('junctions_updated', this.junctionsState);
      }
      if (e.key === STORAGE_KEYS.INCIDENTS && e.newValue) {
        this.incidentsState = JSON.parse(e.newValue);
        this.dispatchLocal('incidents_updated', this.incidentsState);
      }
      if (e.key === STORAGE_KEYS.MESSAGES && e.newValue) {
        this.coordinationMessages = JSON.parse(e.newValue);
        this.dispatchLocal('police_message', this.coordinationMessages[0]);
      }
    });
  }

  private handleIncomingBroadcast(event: string, data: any) {
    switch (event) {
      case 'emergency_status':
      case 'emergency_triggered':
        if (data && (data.status === 'ACTIVE' || data.status === 'ACCEPTED' || data.status === 'PENDING')) {
          this.activeEmergencyState = data;
          this.emergenciesState = [data, ...this.emergenciesState.filter(e => e.id !== data.id)];
        } else {
          this.activeEmergencyState = null;
          if (data?.id) {
            this.emergenciesState = this.emergenciesState.map(e => e.id === data.id ? data : e);
          }
        }
        audioAlert.playEmergencyAlert();
        break;

      case 'ambulance_location':
        if (this.activeEmergencyState && (!data.ambulanceId || this.activeEmergencyState.ambulanceId === data.ambulanceId)) {
          this.activeEmergencyState = {
            ...this.activeEmergencyState,
            currentSpeedKmH: data.speedKmH,
            route: this.activeEmergencyState.route ? {
              ...this.activeEmergencyState.route,
              distanceMeters: data.distanceRemainingMeters ?? this.activeEmergencyState.route.distanceMeters,
              etaSeconds: data.etaSeconds ?? this.activeEmergencyState.route.etaSeconds,
            } : undefined,
          };
        }
        break;

      case 'junctions_updated':
        this.junctionsState = data;
        break;

      case 'traffic_incident':
        this.incidentsState = [data, ...this.incidentsState.filter(i => i.id !== data.id)];
        audioAlert.playEmergencyAlert();
        break;

      case 'police_message':
        this.coordinationMessages = [data, ...this.coordinationMessages.filter(m => m.id !== data.id)];
        audioAlert.playSuccessChime();
        break;

      case 'hospital_prep_update':
        if (this.activeEmergencyState && this.activeEmergencyState.id === data.emergencyId) {
          this.activeEmergencyState.hospitalPrep = data.prepState;
        }
        break;
    }

    this.persistState();
    this.dispatchLocal(event, data);
  }

  // ── Event Bus ──
  public on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  public off(event: string, handler: EventHandler) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
    }
  }

  private dispatchLocal(event: string, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      });
    }
  }

  /**
   * Emits locally and broadcasts to all other browser tabs & windows in real-time
   */
  public emit(event: string, data: any) {
    this.dispatchLocal(event, data);

    // Broadcast across tabs
    if (this.channel) {
      try {
        this.channel.postMessage({
          event,
          data,
          timestamp: Date.now(),
          senderId: this.instanceId,
        });
      } catch (e) {
        console.warn('Broadcast channel post failed:', e);
      }
    }

    // Send via WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ event, data }));
      } catch {
        // Fallback silently
      }
    }
  }

  // ── Live In-Memory & Persisted State Getters ──
  public getActiveEmergency(): Emergency | null {
    return this.activeEmergencyState;
  }

  public getAllEmergencies(): Emergency[] {
    return this.emergenciesState;
  }

  public getJunctions(): Junction[] {
    return this.junctionsState;
  }

  public getIncidents(): TrafficIncident[] {
    return this.incidentsState;
  }

  public getCoordinationMessages(): PoliceCoordinationMessage[] {
    return this.coordinationMessages;
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // ── Core Operational Actions ──

  /**
   * Broadcast real device GPS coordinates of the ambulance to Police and Hospital
   */
  public broadcastAmbulanceLocation(data: {
    ambulanceId: string;
    position: [number, number];
    heading: number;
    speedKmH: number;
    distanceRemainingMeters?: number;
    etaSeconds?: number;
  }) {
    if (this.activeEmergencyState) {
      this.activeEmergencyState = {
        ...this.activeEmergencyState,
        currentSpeedKmH: data.speedKmH,
        route: this.activeEmergencyState.route ? {
          ...this.activeEmergencyState.route,
          distanceMeters: data.distanceRemainingMeters ?? this.activeEmergencyState.route.distanceMeters,
          etaSeconds: data.etaSeconds ?? this.activeEmergencyState.route.etaSeconds,
        } : undefined,
      };
      this.persistState();
    }

    this.emit('ambulance_location', data);
  }

  /**
   * Trigger a real live SOS emergency corridor
   */
  public triggerEmergency(emergency: Emergency) {
    this.activeEmergencyState = { ...emergency };
    this.emergenciesState = [
      this.activeEmergencyState,
      ...this.emergenciesState.filter(e => e.id !== emergency.id)
    ];

    // Reset junctions along route to PREPARING status
    this.junctionsState = this.junctionsState.map(j => ({
      ...j,
      status: 'PREPARING' as JunctionStatus,
      distanceFromAmbulanceMeters: 1200,
      etaSeconds: 120,
    }));

    this.persistState();
    audioAlert.playEmergencyAlert();

    this.emit('emergency_status', this.activeEmergencyState);
    this.emit('emergency_triggered', this.activeEmergencyState);
    this.emit('police_alert', this.activeEmergencyState);
    this.emit('hospital_alert', this.activeEmergencyState);
    this.emit('junctions_updated', this.junctionsState);
  }

  /**
   * Update the status of an emergency (ACCEPTED, ACTIVE, COMPLETED, CANCELLED)
   */
  public updateEmergencyStatus(id: string, status: EmergencyStatus, extra?: Partial<Emergency>) {
    let updated: Emergency | null = null;
    this.emergenciesState = this.emergenciesState.map(e => {
      if (e.id === id) {
        updated = {
          ...e,
          status,
          ...extra,
          ...(status === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {}),
          ...(status === 'ACCEPTED' ? { acceptedAt: new Date().toISOString() } : {}),
        };
        return updated;
      }
      return e;
    });

    if (this.activeEmergencyState?.id === id) {
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        this.activeEmergencyState = null;
      } else if (updated) {
        this.activeEmergencyState = updated;
      }
    }

    this.persistState();

    if (updated || status === 'COMPLETED' || status === 'CANCELLED') {
      audioAlert.playSuccessChime();
      this.emit('emergency_status', updated || { id, status });
      this.emit('police_alert', updated || { id, status });
      this.emit('hospital_alert', updated || { id, status });
    }
  }

  /**
   * Update Junction clearance status (PREPARING -> CLEARED -> PASSED)
   */
  public updateJunctionStatus(junctionId: string, status: JunctionStatus) {
    this.junctionsState = this.junctionsState.map(j => {
      if (j.id === junctionId) {
        return {
          ...j,
          status,
          ...(status === 'CLEARED' || status === 'PASSED' ? { clearedAt: new Date().toISOString() } : {}),
        };
      }
      return j;
    });

    this.persistState();
    audioAlert.playSuccessChime();
    this.emit('junctions_updated', this.junctionsState);
  }

  /**
   * Update Hospital ER Preparation Checklist
   */
  public updateHospitalPreparation(emergencyId: string, prepState: HospitalPreparationState) {
    if (this.activeEmergencyState?.id === emergencyId) {
      this.activeEmergencyState = {
        ...this.activeEmergencyState,
        hospitalPrep: prepState,
      };
    }
    this.emergenciesState = this.emergenciesState.map(e => {
      if (e.id === emergencyId) {
        return { ...e, hospitalPrep: prepState };
      }
      return e;
    });

    this.persistState();
    audioAlert.playSuccessChime();
    this.emit('hospital_prep_update', { emergencyId, prepState });
  }

  /**
   * Report a traffic incident (accident/roadblock)
   */
  public reportIncident(incident: TrafficIncident) {
    this.incidentsState = [incident, ...this.incidentsState];
    this.persistState();
    audioAlert.playEmergencyAlert();
    this.emit('traffic_incident', incident);
    this.emit('incidents_updated', this.incidentsState);
  }

  /**
   * Send a police handover / coordination message between officers
   */
  public sendPoliceCoordinationMessage(msg: PoliceCoordinationMessage) {
    this.coordinationMessages = [msg, ...this.coordinationMessages];
    this.persistState();
    audioAlert.playSuccessChime();
    this.emit('police_message', msg);
  }

  // ── WebSocket Connection (Optional Backend) ──
  public connect(role: string, userId: string) {
    if (typeof window === 'undefined') return;
    try {
      const url = `${this.wsUrl}/${role}/${userId}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.connectionState = 'connected';
        this.emit('connection_state', 'connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event && payload.data) {
            this.handleIncomingBroadcast(payload.event, payload.data);
          }
        } catch {
          // Ignored malformed message
        }
      };

      this.ws.onclose = () => {
        this.connectionState = 'connected';
      };

      this.ws.onerror = () => {
        this.connectionState = 'connected';
      };
    } catch {
      this.connectionState = 'connected';
    }
  }
}

export const realtimeService = new RealtimeService();

