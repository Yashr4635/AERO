/**
 * AERO API Client
 * Configured to seamlessly connect with FastAPI backend or fall back to mock data.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'; // defaults to true for standalone demo

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Attempt to load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('aero_token');
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('aero_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('aero_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public isMockEnabled(): boolean {
    return USE_MOCK_API;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Platform': 'web',
      'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  public async get<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API GET error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  public async post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API POST error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  public async put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API PUT error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  public async delete<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API DELETE error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
