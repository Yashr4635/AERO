import type {
  EmergencyIncident,
  ConnectionState,
} from '../types';
import { supabase } from '../lib/supabase';

type EventHandler = (data: any) => void;

class RealtimeService {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private connectionState: ConnectionState = 'connected';
  
  constructor() {
    this.initSupabaseRealtime();
  }

  private initSupabaseRealtime() {
    if (typeof window === 'undefined') return;

    // Clean up any existing channel with this name to prevent HMR crash
    supabase.getChannels().forEach((ch: any) => {
      if (ch.topic === 'realtime:public:emergency_incidents') {
        supabase.removeChannel(ch);
      }
    });

    // Listen to changes on the emergency_incidents table
    supabase
      .channel('public:emergency_incidents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_incidents' },
        (payload: any) => {
          console.log('Realtime DB Event:', payload);
          this.fetchAndBroadcastIncidents();
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          this.connectionState = 'connected';
          this.dispatchLocal('connection_change', 'connected');
          this.fetchAndBroadcastIncidents();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.connectionState = 'disconnected';
          this.dispatchLocal('connection_change', 'disconnected');
        }
      });
  }

  private async fetchAndBroadcastIncidents() {
    try {
      const { data, error } = await supabase.from('emergency_incidents')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        this.dispatchLocal('incidents_updated', data as EmergencyIncident[]);
      }
    } catch (e) {
      console.error(e);
    }
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

  // ── Compatibility Accessors ──
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Stubbed legacy methods to prevent compiler errors in other dashboards
  public getAllEmergencies(): any[] { return []; }
  public getActiveEmergency(): any | null { return null; }
  public getJunctions(): any[] { return []; }
  public getIncidents(): any[] { return []; }
  public getCoordinationMessages(): any[] { return []; }
  public triggerEmergency(_e: any) {}
  public reportIncident(_e: any) {}
  public updateEmergencyStatus(_id: string, _status: string) {}
  public updateJunctionStatus(_id: string, _status: string) {}
  public updateHospitalPreparation(_id: string, _prep: any) {}
  public sendPoliceCoordinationMessage(_msg: any) {}
}

export const realtimeService = new RealtimeService();
