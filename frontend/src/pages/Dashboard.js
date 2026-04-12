import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMonthlySummary } from '../services/api';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getMonthlySummary(month, year);
        setSummary(res.data.summary);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [month, year, navigate]);

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Overview of this month</p>

      <div className="card-grid">
        <div className="card">
          <div className="card-label">Income</div>
          <div className="card-value">${summary?.income?.toFixed(2) || '0.00'}</div>
        </div>

        <div className="card">
          <div className="card-label">Budget Remaining</div>
          <div className="card-value" style={{ color: summary?.budget_remaining < 0 ? '#e74c3c' : '#27ae60' }}>
            ${summary?.budget_remaining?.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="card">
          <div className="card-label">Total Spent</div>
          <div className="card-value" style={{ color: '#e74c3c' }}>
            ${summary?.total_spent?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      <div className="actions-row">
        <button className="btn btn-primary" onClick={() => navigate('/expenses/add')}>
          Add New Expense
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/expenses')}>
          View All Expenses
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
