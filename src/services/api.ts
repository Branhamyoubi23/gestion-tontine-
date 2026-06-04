import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const API_URL = API_BASE_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      // Clear token and redirect to home portal
      localStorage.removeItem('token');
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  login: async (phone: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { phone, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  register: async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      console.error('Get current user error:', error.response?.data || error.message);
      throw error;
    }
  },

  updateProfile: async (userData: any) => {
    try {
      const response = await api.put('/auth/profile', userData);
      return response.data;
    } catch (error: any) {
      console.error('Update profile error:', error.response?.data || error.message);
      throw error;
    }
  },

  setupPassword: async (userId: number, newPassword: string) => {
    try {
      const response = await api.post('/auth/setup-password', { userId, newPassword });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      console.error('Setup password error:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Tontine service
export const tontineService = {
  createTontine: async (tontineData: any) => {
    try {
      const response = await api.post('/tontines', tontineData);
      return response.data;
    } catch (error: any) {
      console.error('Create tontine error:', error.response?.data || error.message);
      throw error;
    }
  },

  getUserTontines: async () => {
    try {
      const response = await api.get('/tontines/user');
      return response.data;
    } catch (error: any) {
      console.error('Get user tontines error:', error.response?.data || error.message);
      throw error;
    }
  },

  getTontineDetails: async (id: string) => {
    try {
      const response = await api.get(`/tontines/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get tontine details error:', error.response?.data || error.message);
      throw error;
    }
  },

  addMember: async (tontineId: string, memberData: any) => {
    try {
      const response = await api.post(`/tontines/${tontineId}/members`, memberData);
      return response.data;
    } catch (error: any) {
      console.error('Add member error:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteTontine: async (id: string) => {
    try {
      const response = await api.delete(`/tontines/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete tontine error:', error.response?.data || error.message);
      throw error;
    }
  },

  updateTontine: async (id: string, tontineData: any) => {
    try {
      const response = await api.put(`/tontines/${id}`, tontineData);
      return response.data;
    } catch (error: any) {
      console.error('Update tontine error:', error.response?.data || error.message);
      throw error;
    }
  },

  uploadTontineImage: async (id: number, formData: FormData) => {
    try {
      const response = await api.post(`/tontines/${id}/profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading tontine profile image:', error);
      throw error;
    }
  },

  testUploadImage: async (formData: FormData) => {
    try {
      const response = await api.post('/tontines/test-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error testing image upload:', error);
      throw error;
    }
  },

  getTontineMembers: async (id: string) => {
    try {
      const response = await api.get(`/tontines/${id}/members`);
      return response.data;
    } catch (error: any) {
      console.error('Get tontine members error:', error.response?.data || error.message);
      throw error;
    }
  },

  getDrawPool: async (id: string) => {
    try {
      const response = await api.get(`/tontines/${id}/draw-pool`);
      return response.data;
    } catch (error: any) {
      console.error('Get draw pool error:', error.response?.data || error.message);
      throw error;
    }
  },

  drawPosition: async (id: string, caseIndex: number) => {
    try {
      const response = await api.post(`/tontines/${id}/draw-position`, { caseIndex });
      return response.data;
    } catch (error: any) {
      console.error('Draw position error:', error.response?.data || error.message);
      throw error;
    }
  },

  markMemberAbsent: async (tontineId: string, userId: number) => {
    try {
      const response = await api.put(`/tontines/${tontineId}/members/${userId}/absent`);
      return response.data;
    } catch (error: any) {
      console.error('Mark member absent error:', error.response?.data || error.message);
      throw error;
    }
  },

  removeMember: async (tontineId: string, userId: number) => {
    try {
      const response = await api.delete(`/tontines/${tontineId}/members/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Remove member error:', error.response?.data || error.message);
      throw error;
    }
  },

  updateMemberRole: async (tontineId: string, userId: number, role: string) => {
    try {
      const response = await api.put(`/tontines/${tontineId}/members/${userId}/role`, { role });
      return response.data;
    } catch (error: any) {
      console.error('Update member role error:', error.response?.data || error.message);
      throw error;
    }
  },

  applyPenalty: async (tontineId: string | number, userId: string | number, penaltyAmount: number = 1000) => {
    try {
      const response = await api.post(`/tontines/${tontineId}/members/${userId}/penalty`, { penaltyAmount });
      return response.data;
    } catch (error: any) {
      console.error('Apply penalty error:', error.response?.data || error.message);
      throw error;
    }
  },
  updateMemberProfile: async (tontineId: string, userId: number, memberData: { name: string, phone: string, role?: string, email?: string, status?: string }) => {
    try {
      const response = await api.put(`/tontines/${tontineId}/members/${userId}`, memberData);
      return response.data;
    } catch (error: any) {
      console.error('Update member profile error:', error.response?.data || error.message);
      throw error;
    }
  },
  updateRotationOrder: async (tontineId: string, rotation: { userId: number, position: number }[]) => {
    try {
      const response = await api.put(`/tontines/${tontineId}/rotation`, { rotation });
      return response.data;
    } catch (error: any) {
      console.error('Update rotation error:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Transaction service
export const transactionService = {
  getAll: async () => {
    try {
      const response = await api.get('/transactions/user');
      return response.data;
    } catch (error: any) {
      console.error('Get transactions error:', error.response?.data || error.message);
      throw error;
    }
  },

  create: async (transactionData: any) => {
    try {
      const response = await api.post('/transactions', transactionData);
      return response.data;
    } catch (error: any) {
      console.error('Create transaction error:', error.response?.data || error.message);
      throw error;
    }
  },

  getByTontine: async (tontineId: string) => {
    try {
      const response = await api.get(`/transactions/tontine/${tontineId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get tontine transactions error:', error.response?.data || error.message);
      throw error;
    }
  },

  verify: async (id: string, status: 'completed' | 'failed') => {
    try {
      const response = await api.put(`/transactions/${id}/verify`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Verify transaction error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Role-aware: admin gets all, member gets only theirs — filtered by tontine
  getByTontineScoped: async (tontineId: string) => {
    try {
      const response = await api.get(`/transactions/tontine/${tontineId}`);
      return response.data; // { success, isAdmin, data: [...] }
    } catch (error: any) {
      console.error('Get tontine transactions error:', error.response?.data || error.message);
      throw error;
    }
  },

  adminRecord: async (data: { tontineId: string, userId: number, amount: number, type: string, description?: string, date?: string }) => {
    try {
      const response = await api.post('/transactions/admin-record', data);
      return response.data;
    } catch (error: any) {
      console.error('Admin record transaction error:', error.response?.data || error.message);
      throw error;
    }
  },

  getTontineStats: async (tontineId: string) => {
    try {
      const response = await api.get(`/transactions/tontine/${tontineId}/stats`);
      return response.data;
    } catch (error: any) {
      console.error('Get tontine stats error:', error.response?.data || error.message);
      throw error;
    }
  },
  getBankBreakdown: async (tontineId: string) => {
    try {
      const response = await api.get(`/transactions/tontine/${tontineId}/bank-breakdown`);
      return response.data;
    } catch (error: any) {
      console.error('Get bank breakdown error:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id: string | number, data: any) => {
    try {
      const response = await api.put(`/transactions/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update transaction error:', error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (id: string | number) => {
    try {
      const response = await api.delete(`/transactions/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete transaction error:', error.response?.data || error.message);
      throw error;
    }
  }
};

// User service
export const userService = {
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  },

  updateProfile: async (data: {
    name?: string;
    email?: string;
    phone?: string;
    language?: string;
  }) => {
    try {
      const response = await api.put('/users/profile', data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  uploadProfilePicture: async (formData: FormData) => {
    try {
      const response = await api.post('/users/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  },

  updateOnboardingStep: async (step: number) => {
    try {
      const response = await api.put('/users/profile/onboarding', { step });
      return response.data;
    } catch (error: any) {
      console.error('Update onboarding step error:', error.response?.data || error.message);
      throw error;
    }
  },

  changePassword: async (passwordData: any) => {
    try {
      const response = await api.put('/users/password', passwordData);
      return response.data;
    } catch (error: any) {
      console.error('Change password error:', error.response?.data || error.message);
      throw error;
    }
  }
};


// Notification service
export const notificationService = {
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error: any) {
      console.error('Get notifications error:', error.response?.data || error.message);
      throw error;
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error: any) {
      console.error('Mark as read error:', error.response?.data || error.message);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error: any) {
      console.error('Mark all as read error:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete notification error:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteAllRead: async () => {
    try {
      const response = await api.delete('/notifications/read-all');
      return response.data;
    } catch (error: any) {
      console.error('Delete all read error:', error.response?.data || error.message);
      throw error;
    }
  },

  savePreferences: async (prefs: Record<string, boolean>) => {
    try {
      const response = await api.put('/notifications/preferences', prefs);
      return response.data;
    } catch (error: any) {
      console.error('Save preferences error:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Draw service (Hybrid draw system)
export const drawService = {
  openSession: async (tontineId: string, mode: string = 'hybrid') => {
    const res = await api.post(`/draw/${tontineId}/open`, { mode });
    return res.data;
  },
  getSession: async (tontineId: string) => {
    const res = await api.get(`/draw/${tontineId}/session`);
    return res.data;
  },
  drawOnline: async (tontineId: string) => {
    const res = await api.post(`/draw/${tontineId}/draw`);
    return res.data;
  },
  drawPhysical: async (tontineId: string, memberId: number, position: number) => {
    const res = await api.post(`/draw/${tontineId}/physical`, { memberId, position });
    return res.data;
  },
  lockSession: async (tontineId: string) => {
    const res = await api.post(`/draw/${tontineId}/lock`);
    return res.data;
  },
  getResults: async (tontineId: string) => {
    const res = await api.get(`/draw/${tontineId}/results`);
    return res.data;
  },
  getMembersStatus: async (tontineId: string) => {
    const res = await api.get(`/draw/${tontineId}/members-status`);
    return res.data;
  }
};

// Bank service (Micro-banking features)
export const bankService = {
  getStats: async (tontineId: string) => {
    const res = await api.get(`/bank/${tontineId}/stats`);
    return res.data;
  },
  distributeProfits: async (tontineId: string) => {
    const res = await api.post(`/bank/${tontineId}/distribute-profits`);
    return res.data;
  },
  recordLoan: async (tontineId: string, loanData: any) => {
    const res = await api.post(`/bank/${tontineId}/loans`, loanData);
    return res.data;
  },
  getLoans: async (tontineId: string) => {
    const res = await api.get(`/bank/${tontineId}/loans`);
    return res.data;
  },
  repayLoan: async (loanId: string | number) => {
    const res = await api.put(`/bank/loans/${loanId}/repay`);
    return res.data;
  },
  recordAuction: async (tontineId: string, auctionData: any) => {
    const res = await api.post(`/bank/${tontineId}/auctions`, auctionData);
    return res.data;
  },
  getAuctions: async (tontineId: string) => {
    const res = await api.get(`/bank/${tontineId}/auctions`);
    return res.data;
  },
  getProfitHistory: async (tontineId: string) => {
    const res = await api.get(`/bank/${tontineId}/profit-history`);
    return res.data;
  }
};

// Join tontine by code
export const joinByCode = async (join_code: string) => {
  const res = await api.post('/tontines/join-by-code', { join_code });
  return res.data;
};

// Invitation service
export const invitationService = {
  sendInvitation: async (tontineId: string, nameOrEmail: string) => {
    try {
      const response = await api.post('/invitations', { tontine_id: tontineId, nameOrEmail });
      return response.data;
    } catch (error: any) {
      console.error('Send invitation error:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default api;