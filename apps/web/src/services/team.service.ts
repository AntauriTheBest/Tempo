import { apiClient } from './api-client';

export const teamService = {
  async getDashboard() {
    const res = await apiClient.get('/reports/team-dashboard');
    return res.data.data;
  },
};
