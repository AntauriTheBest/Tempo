import { apiClient } from './api-client';

export interface WAStatus {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  connectedPhone: string | null;
  hasQr: boolean;
  provider: 'baileys' | 'twilio';
}

export interface WhatsAppSettings {
  provider: string;
  twilioAccountSid: string;
  twilioFromNumber: string;
}

export const whatsappService = {
  async getStatus(): Promise<WAStatus> {
    const res = await apiClient.get<{ success: boolean; data: WAStatus }>('/admin/whatsapp/status');
    return res.data.data;
  },

  async getQr(): Promise<string | null> {
    try {
      const res = await apiClient.get<{ success: boolean; data: { qr: string } }>('/admin/whatsapp/qr');
      return res.data.data.qr;
    } catch {
      return null;
    }
  },

  async disconnect(): Promise<void> {
    await apiClient.post('/admin/whatsapp/disconnect');
  },

  async getSettings(): Promise<WhatsAppSettings> {
    const res = await apiClient.get<{ success: boolean; data: WhatsAppSettings }>('/admin/whatsapp/settings');
    return res.data.data;
  },

  async updateSettings(data: {
    provider?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioFromNumber?: string;
  }): Promise<WhatsAppSettings> {
    const res = await apiClient.put<{ success: boolean; data: WhatsAppSettings }>('/admin/whatsapp/settings', data);
    return res.data.data;
  },
};
