import type { UserRole } from '../../../types';

export interface RegisterData {
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  badgeNumber?: string;
  vehicleNumber?: string;
  hospitalId?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  async register(data: RegisterData) {
    await delay(500);
    // Store in session storage for demo persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aero_registered_user', JSON.stringify(data));
    }
    return { success: true, email: data.email, role: data.role };
  },

  async verifyEmail(tokenOrCode: string) {
    await delay(600);
    if (tokenOrCode === 'invalid') throw new Error('Invalid verification code');
    return { success: true };
  },

  async resendVerification(email: string) {
    await delay(500);
    return { success: true, email };
  },

  async requestPasswordReset(_email: string) {
    await delay(400);
    return { success: true };
  },

  async loginWithGoogle() {
    await delay(600);
    throw new Error('Google OAuth requires Google Cloud Project credentials on backend.');
  },
};
