import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBudgetAlerts } from '../services/api';

function BudgetAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getBudgetAlerts(month, year);
        setAlerts(res.data.alerts);
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
      <h1 className="page-title">Budget Alerts</h1>
      <p className="page-subtitle">Spending warnings</p>

      {alerts.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#888' }}>No alerts</p>
        </div>
      )}

      {alerts.map((alert, i) => (
        <div className={`alert alert-${alert.type}`} key={i}>
          <div className="alert-type">{alert.type}</div>
          <p>{alert.message}</p>
        </div>
      ))}
    </div>
  );
}

export default BudgetAlerts;
