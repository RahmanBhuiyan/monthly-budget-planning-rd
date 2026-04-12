import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCategoryBreakdown, getMonthlySummary } from '../services/api';

function MonthlyAnalysis() {
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, sumRes] = await Promise.all([
          getCategoryBreakdown(month, year),
          getMonthlySummary(month, year)
        ]);
        setCategories(catRes.data.categories);
        setSummary(sumRes.data.summary);
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

  const chartData = categories.map((c) => ({
    name: c.category,
    amount: c.total
  }));

  return (
    <div className="page">
      <h1 className="page-title">Monthly Analysis</h1>
      <p className="page-subtitle">Spending trends</p>

      {chartData.length > 0 ? (
        <div className="chart-container">
          <div className="chart-title">Spending by Category</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={13} />
              <YAxis fontSize={13} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Bar dataKey="amount" fill="#1a1a2e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#888' }}>No data yet</p>
        </div>
      )}

      <div className="card-grid">
        <div className="card">
          <div className="card-label">Top Spending Area</div>
          <div className="card-value">{summary?.highest_category || 'N/A'}</div>
        </div>

        <div className="card">
          <div className="card-label">Average Daily Spending</div>
          <div className="card-value">${summary?.avg_daily_spending?.toFixed(2) || '0.00'}</div>
        </div>
      </div>

      <div className="actions-row">
        <button className="btn btn-outline" onClick={() => navigate('/categories')}>
          View Categories
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/alerts')}>
          View Budget Alerts
        </button>
      </div>
    </div>
  );
}

export default MonthlyAnalysis;
