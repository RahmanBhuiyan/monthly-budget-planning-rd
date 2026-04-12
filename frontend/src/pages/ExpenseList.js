import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExpenses, deleteExpense } from '../services/api';

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fetchExpenses = async () => {
    try {
      const res = await getExpenses(month, year);
      setExpenses(res.data.expenses);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete expense');
    }
  };

  const grouped = expenses.reduce((acc, exp) => {
    const d = exp.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(exp);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === yesterday.getTime()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <h1 className="page-title">Expenses</h1>
      <p className="page-subtitle">{expenses.length} expenses this month</p>

      {Object.keys(grouped).length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#888' }}>No expenses recorded yet</p>
        </div>
      )}

      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <div className="date-header">{formatDate(date)}</div>
          {items.map((exp) => (
            <div className="expense-item" key={exp.id}>
              <div className="expense-info">
                <div className="expense-note">{exp.note || exp.category}</div>
                <div className="expense-category">{exp.category}</div>
              </div>
              <span className="expense-amount">-${exp.amount.toFixed(2)}</span>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp.id)}>
                X
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default ExpenseList;
