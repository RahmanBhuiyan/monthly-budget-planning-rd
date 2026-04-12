import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMonthlySummary } from '../services/api';

function MonthlySummary() {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="page">
      <h1 className="page-title">Monthly Summary</h1>
      <p className="page-subtitle">End of month report</p>

      <div className="card-grid">
        <div className="card">
          <div className="card-label">Income</div>
          <div className="card-value">${summary?.income?.toFixed(2) || '0.00'}</div>
        </div>

        <div className="card">
          <div className="card-label">Spent</div>
          <div className="card-value" style={{ color: '#e74c3c' }}>
            ${summary?.total_spent?.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="card">
          <div className="card-label">Saved</div>
          <div className="card-value" style={{ color: summary?.saved >= 0 ? '#27ae60' : '#e74c3c' }}>
            ${summary?.saved?.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="card">
          <div className="card-label">Highest Expense</div>
          <div className="card-value">{summary?.highest_category || 'N/A'}</div>
        </div>
      </div>

      <div className="actions-row">
        <button className="btn btn-outline" onClick={() => navigate('/setup/income')}>
          Update Income / Budget
        </button>
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
          Logged in as <strong>{user.username || 'User'}</strong>
        </p>
        <button className="btn btn-danger" style={{ width: '100%', maxWidth: 480 }} onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}

export default MonthlySummary;
