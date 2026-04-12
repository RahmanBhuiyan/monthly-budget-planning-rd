import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:7576/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);

// Income
export const setIncome = (data) => API.post('/income', data);
export const getIncome = (month, year) => API.get(`/income?month=${month}&year=${year}`);

// Budget
export const setBudget = (data) => API.post('/budget', data);
export const getBudget = (month, year) => API.get(`/budget?month=${month}&year=${year}`);

// Expenses
export const addExpense = (data) => API.post('/expenses', data);
export const getExpenses = (month, year) => API.get(`/expenses?month=${month}&year=${year}`);
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);

// Reports
export const getMonthlySummary = (month, year) => API.get(`/reports/summary?month=${month}&year=${year}`);
export const getCategoryBreakdown = (month, year) => API.get(`/reports/categories?month=${month}&year=${year}`);
export const getBudgetAlerts = (month, year) => API.get(`/reports/alerts?month=${month}&year=${year}`);

export default API;
