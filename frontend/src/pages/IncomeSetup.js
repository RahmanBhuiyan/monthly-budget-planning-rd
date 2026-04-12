import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setIncome } from '../services/api';

function IncomeSetup() {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (parseFloat(amount) <= 0) {
      setError('Please enter a valid income amount');
      return;
    }
    try {
      await setIncome({ amount: parseFloat(amount), month, year });
      navigate('/setup/budget');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save income');
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Set Monthly Income</h1>
      <p className="step-indicator">Step 1</p>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-wrapper">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Monthly Income</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter your income (e.g. $500)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Save Income</button>
        </form>
      </div>
    </div>
  );
}

export default IncomeSetup;
