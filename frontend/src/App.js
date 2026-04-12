import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import IncomeSetup from './pages/IncomeSetup';
import BudgetSetup from './pages/BudgetSetup';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import ExpenseList from './pages/ExpenseList';
import Categories from './pages/Categories';
import MonthlyAnalysis from './pages/MonthlyAnalysis';
import BudgetAlerts from './pages/BudgetAlerts';
import MonthlySummary from './pages/MonthlySummary';
import BottomNav from './components/BottomNav';
import './App.css';

const noNavRoutes = ['/', '/login', '/signup'];

function AppContent() {
  const location = useLocation();
  const showNav = !noNavRoutes.includes(location.pathname);

  return (
    <div className="App">
      {showNav && <BottomNav />}
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/setup/income" element={<IncomeSetup />} />
        <Route path="/setup/budget" element={<BudgetSetup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/expenses/add" element={<AddExpense />} />
        <Route path="/expenses" element={<ExpenseList />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/analysis" element={<MonthlyAnalysis />} />
        <Route path="/alerts" element={<BudgetAlerts />} />
        <Route path="/summary" element={<MonthlySummary />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
