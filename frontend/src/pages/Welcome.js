import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiCurrencyDollar, HiChartBar, HiShieldCheck, HiBell } from 'react-icons/hi';

function Welcome() {
  const navigate = useNavigate();

  const handleStart = () => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <div className="welcome-icon-circle">
          <HiCurrencyDollar />
        </div>
        <h1 className="welcome-title">Smart Expense<br />& Budget Tracker</h1>
        <p className="welcome-tagline">Take control of your finances. Track spending, set budgets, and build better money habits.</p>

        <div className="welcome-features">
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon"><HiCurrencyDollar /></div>
            <div>
              <strong>Track Expenses</strong>
              <span>Log daily spending by category</span>
            </div>
          </div>
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon"><HiShieldCheck /></div>
            <div>
              <strong>Stay Within Budget</strong>
              <span>Set monthly limits and savings goals</span>
            </div>
          </div>
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon"><HiChartBar /></div>
            <div>
              <strong>See Monthly Analysis</strong>
              <span>Charts and insights on your habits</span>
            </div>
          </div>
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon"><HiBell /></div>
            <div>
              <strong>Smart Alerts</strong>
              <span>Get warned before you overspend</span>
            </div>
          </div>
        </div>

        <button className="btn welcome-btn" onClick={handleStart}>
          Get Started
        </button>
        <p className="welcome-footer">Free to use. No credit card required.</p>
      </div>
    </div>
  );
}

export default Welcome;
