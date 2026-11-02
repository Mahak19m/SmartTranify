// SmartTranify Backend API Client

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  goal?: string | null;
  created_at?: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  name: string;
  email: string;
}

export interface FitnessProfileData {
  name?: string;
  age?: number;
  height?: number;
  weight?: number;
  gender?: string;
  fitness_experience?: 'beginner' | 'intermediate' | 'advanced';
  fitness_goal?: string;
  activity_level?: string;
  available_workout_days?: number;
  workout_duration?: number;
  available_equipment?: string;
  dietary_preference?: string;
  food_allergies?: string;
  dietary_restrictions?: string;
  physical_limitations?: string;
  baseline_mobility_score?: number;
  baseline_notes?: string;
  updated_at?: string;
}

export const api = {
  getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('smarttranify_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async register(name: string, email: string, password: string):Promise<AuthTokenResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }

    const data: AuthTokenResponse = await res.json();
    localStorage.setItem('smarttranify_token', data.access_token);
    return data;
  },

  async login(email: string, password: string): Promise<AuthTokenResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }));
      throw new Error(err.detail || 'Login failed');
    }

    const data: AuthTokenResponse = await res.json();
    localStorage.setItem('smarttranify_token', data.access_token);
    return data;
  },

  async getMe(): Promise<UserResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch user');
    }
    return res.json();
  },

  async getProfile(): Promise<FitnessProfileData> {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch profile');
    }
    return res.json();
  },

  async saveProfile(profile: FitnessProfileData): Promise<FitnessProfileData> {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to save profile' }));
      throw new Error(err.detail || 'Failed to save profile');
    }
    return res.json();
  },

  async recordWorkoutSession(sessionData: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(sessionData),
    });
    if (!res.ok) {
      throw new Error('Failed to record session');
    }
    return res.json();
  },

  async getProgressSummary(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/progress/summary`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch progress summary');
    }
    return res.json();
  },

  logout() {
    localStorage.removeItem('smarttranify_token');
  }
};
