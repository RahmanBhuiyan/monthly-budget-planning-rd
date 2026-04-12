import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategoryBreakdown } from '../services/api';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getCategoryBreakdown(month, year);
        setCategories(res.data.categories);
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
      <h1 className="page-title">Expense Categories</h1>
      <p className="step-indicator">Step 4</p>

      {categories.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#888' }}>No expenses recorded yet</p>
        </div>
      )}

      <div className="category-grid">
        {categories.map((cat) => (
          <div className="category-card" key={cat.category}>
            <span className="category-name">{cat.category}</span>
            <span className="category-amount">${cat.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Categories;
