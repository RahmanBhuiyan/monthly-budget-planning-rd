import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setBudget } from '../services/api';

function BudgetSetup() {
  const [amount, setAmount] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (parseFloat(amount) <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }
    try {
      await setBudget({
        amount: parseFloat(amount),
        savings_goal: parseFloat(savingsGoal) || 0,
        month,
        year
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save budget');
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Set Monthly Budget</h1>
      <p className="step-indicator">Step 2</p>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-wrapper">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Monthly Budget</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter spending limit"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Savings Goal</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter savings target"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">Save Budget</button>
        </form>
      </div>
    </div>
  );
}

export default BudgetSetup;
