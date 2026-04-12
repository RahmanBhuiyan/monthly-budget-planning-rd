import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addExpense } from '../services/api';

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping'];

function AddExpense() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await addExpense({ amount: parseFloat(amount), category, note, date });
      setSuccess('Expense added!');
      setAmount('');
      setNote('');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense');
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Add Expense</h1>
      <p className="step-indicator">Step 3</p>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="form-wrapper">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. $15"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Note</label>
            <input
              type="text"
              placeholder="Lunch / Bus fare / Shopping"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">Save Expense</button>
        </form>
      </div>
    </div>
  );
}

export default AddExpense;
