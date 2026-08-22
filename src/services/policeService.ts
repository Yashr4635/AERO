import { mockPoliceUnits } from '../mock';
import { realtimeService } from './realtimeService';
import type {
  Emergency,
  AvailabilityStatus,
  Junction,
  JunctionStatus,
  PoliceCoordinationMessage,
  TrafficIncident,
} from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const policeService = {
  async getPoliceState(policeId: string) {
    await delay(200);
    return mockPoliceUnits.find(p => p.id === policeId) || mockPoliceUnits[0];
  },

  async setAvailability(policeId: string, status: AvailabilityStatus) {
    await delay(150);
    const unit = mockPoliceUnits.find(p => p.id === policeId);
    if (unit) unit.availability = status;
    return { success: true, status };
  },

  async getIncomingEmergencies(): Promise<Emergency[]> {
    await delay(250);
    return realtimeService.getAllEmergencies().filter(e => e.status === 'PENDING');
  },

  async getActiveEmergencies(): Promise<Emergency[]> {
    await delay(200);
    return realtimeService.getAllEmergencies().filter(e => e.status === 'ACTIVE' || e.status === 'ACCEPTED');
  },

  async getEmergencyDetails(id: string): Promise<Emergency | undefined> {
    await delay(200);
    return realtimeService.getAllEmergencies().find(e => e.id === id);
  },

  async acceptEmergency(emergencyId: string, policeId: string) {
    await delay(300);
    const officer = mockPoliceUnits.find(p => p.id === policeId) || mockPoliceUnits[0];
    realtimeService.updateEmergencyStatus(emergencyId, 'ACCEPTED', {
      acceptedBy: {
        id: officer.id,
        displayName: officer.name,
        badgeNumber: officer.badgeNumber,
        station: officer.station,
      },
    });
    return { success: true };
  },

  async markActive(emergencyId: string) {
    await delay(200);
    realtimeService.updateEmergencyStatus(emergencyId, 'ACTIVE');
    return { success: true };
  },

  async completeEmergency(emergencyId: string) {
    await delay(300);
    realtimeService.updateEmergencyStatus(emergencyId, 'COMPLETED');
    return { success: true };
  },

  async getJunctions(): Promise<Junction[]> {
    await delay(150);
    return realtimeService.getJunctions();
  },

  async updateJunctionStatus(junctionId: string, status: JunctionStatus) {
    await delay(200);
    realtimeService.updateJunctionStatus(junctionId, status);
    return { success: true, junctionId, status };
  },

  async sendCoordinationMessage(
    emergencyId: string,
    fromOfficerId: string,
    toJunctionId: string,
    message: string
  ): Promise<PoliceCoordinationMessage> {
    await delay(250);
    const officer = mockPoliceUnits.find(p => p.id === fromOfficerId) || mockPoliceUnits[0];
    const junction = realtimeService.getJunctions().find(j => j.id === toJunctionId) || realtimeService.getJunctions()[0];

    const msg: PoliceCoordinationMessage = {
      id: `MSG-${Date.now()}`,
      emergencyId,
      fromOfficerId: officer.id,
      fromOfficerName: officer.name,
      toJunctionId: junction.id,
      toJunctionName: junction.name,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    realtimeService.sendPoliceCoordinationMessage(msg);
    return msg;
  },

  async getCoordinationMessages(): Promise<PoliceCoordinationMessage[]> {
    await delay(100);
    return realtimeService.getCoordinationMessages();
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
};
