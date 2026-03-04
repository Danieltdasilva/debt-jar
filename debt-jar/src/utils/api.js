// API utility functions for Debt Jar backend

const API_BASE_URL = "http://localhost:5000/api";

export const api = {
  // GET /api/debts - Get all debts
  async getDebts() {
    const response = await fetch(`${API_BASE_URL}/debts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch debts: ${response.statusText}`);
    }
    return response.json();
  },

  // POST /api/debts - Create a new debt
  async createDebt(debtData) {
    const response = await fetch(`${API_BASE_URL}/debts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(debtData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create debt: ${response.statusText}`);
    }
    return response.json();
  },

  // PUT /api/debts/:id - Update a debt
  async updateDebt(id, debtData) {
    const response = await fetch(`${API_BASE_URL}/debts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(debtData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update debt: ${response.statusText}`);
    }
    return response.json();
  },

  // DELETE /api/debts/:id - Delete a debt
  async deleteDebt(id) {
    const response = await fetch(`${API_BASE_URL}/debts/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Failed to delete debt: ${response.statusText}`);
    }
    return response.json();
  },
};
