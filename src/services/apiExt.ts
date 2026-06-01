import api from "./api";

export const bankService = {
  getBankStatus: async (tontineId: string | number) => {
    try {
      const response = await api.get(`/bank/${tontineId}/status`);
      return response.data;
    } catch (error: any) {
      console.error("Get bank status error:", error.response?.data || error.message);
      throw error;
    }
  },

  contribute: async (tontineId: string | number, amount: number) => {
    try {
      const response = await api.post("/bank/contribute", { tontineId, amount });
      return response.data;
    } catch (error: any) {
      console.error("Bank contribute error:", error.response?.data || error.message);
      throw error;
    }
  },

  loan: async (loanData: any) => {
    try {
      const response = await api.post("/bank/loan", loanData);
      return response.data;
    } catch (error: any) {
      console.error("Bank loan error:", error.response?.data || error.message);
      throw error;
    }
  },

  reimburse: async (loanId: number) => {
    try {
      const response = await api.post("/bank/reimburse", { loanId });
      return response.data;
    } catch (error: any) {
      console.error("Bank reimburse error:", error.response?.data || error.message);
      throw error;
    }
  }
};
