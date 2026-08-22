import { mockCongestionSegments } from '../mock';
import { realtimeService } from './realtimeService';
import type { Junction, TrafficIncident, CongestionSegment, JunctionStatus } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const trafficService = {
  async getJunctions(): Promise<Junction[]> {
    await delay(150);
    return realtimeService.getJunctions();
  },

  async updateJunctionStatus(junctionId: string, status: JunctionStatus) {
    await delay(200);
    realtimeService.updateJunctionStatus(junctionId, status);
    return { success: true, junctionId, status };
  },

  async getIncidents(): Promise<TrafficIncident[]> {
    await delay(150);
    return realtimeService.getIncidents();
  },

  async reportIncident(incident: Omit<TrafficIncident, 'id' | 'reportedAt' | 'active'>): Promise<TrafficIncident> {
    await delay(250);
    const newIncident: TrafficIncident = {
      ...incident,
      id: `INC-${Math.floor(100 + Math.random() * 900)}`,
      reportedAt: new Date().toISOString(),
      active: true,
    };
    realtimeService.reportIncident(newIncident);
    return newIncident;
  },

  async getCongestionLayers(): Promise<CongestionSegment[]> {
    await delay(100);
    return mockCongestionSegments;
  },
};
