import { mockHospitals } from '../mock';
import { realtimeService } from './realtimeService';
import type { Emergency, Hospital, HospitalPreparationState } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const hospitalService = {
  async getHospitalState(hospitalId: string): Promise<Hospital> {
    await delay(200);
    return mockHospitals.find(h => h.id === hospitalId) || mockHospitals[1];
  },

  async getAllHospitals(): Promise<Hospital[]> {
    await delay(150);
    return mockHospitals;
  },

  async getIncomingEmergencies(hospitalId?: string): Promise<Emergency[]> {
    await delay(200);
    const emergencies = realtimeService.getAllEmergencies().filter(e => e.status === 'ACTIVE' || e.status === 'ACCEPTED' || e.status === 'PENDING');
    if (hospitalId) {
      return emergencies.filter(e => e.hospital.id === hospitalId);
    }
    return emergencies;
  },

  async updatePreparationState(emergencyId: string, prepState: HospitalPreparationState) {
    await delay(200);
    realtimeService.updateHospitalPreparation(emergencyId, prepState);
    return { success: true, prepState };
  },

  async assignLeadDoctor(emergencyId: string, doctorName: string) {
    await delay(200);
    const active = realtimeService.getActiveEmergency();
    if (active && active.id === emergencyId && active.patient) {
      active.patient.leadDoctorAssigned = doctorName;
    }
    return { success: true, doctorName };
  },
};
