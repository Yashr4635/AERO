import { mockAnalyticsData, mockAmbulances, mockPoliceUnits, mockHospitals } from '../mock';
import { realtimeService } from './realtimeService';
import type { Emergency } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyticsService = {
  async getDashboardOverview() {
    await delay(200);
    const allEmergencies = realtimeService.getAllEmergencies();
    const active = allEmergencies.filter(e => e.status === 'ACTIVE' || e.status === 'ACCEPTED');
    const completedToday = allEmergencies.filter(e => e.status === 'COMPLETED').length + 15;

    return {
      activeEmergencies: active.length,
      onlineAmbulances: mockAmbulances.filter(a => a.connectionState === 'connected').length,
      availablePolice: mockPoliceUnits.filter(p => p.availability === 'AVAILABLE').length,
      partnerHospitals: mockHospitals.length,
      completedToday,
      avgResponseTimeMins: mockAnalyticsData.overview.avgResponseTimeMinutes,
      timeSavedMins: mockAnalyticsData.overview.timeSavedVsNormalTrafficMins,
      clearanceSuccessRate: mockAnalyticsData.overview.junctionClearanceSuccessRatePercent,
    };
  },

  async getAnalyticsData() {
    await delay(300);
    return mockAnalyticsData;
  },

  async getEmergencyHistory(): Promise<Emergency[]> {
    await delay(200);
    return realtimeService.getAllEmergencies();
  },

  exportData(format: 'csv' | 'json') {
    const data = realtimeService.getAllEmergencies();
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aero_emergencies_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['ID', 'Status', 'Priority', 'Category', 'Ambulance', 'Hospital', 'ETA (min)', 'Created At'];
      const rows = data.map(e => [
        e.id,
        e.status,
        e.priority || 'CODE_RED',
        e.category || 'CARDIAC',
        `"${e.ambulanceDisplayName}"`,
        `"${e.hospital.name}"`,
        Math.round((e.route?.etaSeconds || 0) / 60),
        e.createdAt,
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aero_emergencies_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  },
};
