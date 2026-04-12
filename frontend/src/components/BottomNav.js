import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiHome, HiPlusCircle, HiChartBar, HiUser, HiCurrencyDollar, HiViewGrid, HiBell, HiClipboardList } from 'react-icons/hi';

const mainNav = [
  { path: '/dashboard', label: 'Home', icon: HiHome },
  { path: '/expenses/add', label: 'Add', icon: HiPlusCircle },
  { path: '/analysis', label: 'Reports', icon: HiChartBar },
  { path: '/summary', label: 'Profile', icon: HiUser },
];

const sidebarExtra = [
  { path: '/expenses', label: 'Expenses', icon: HiClipboardList },
  { path: '/categories', label: 'Categories', icon: HiViewGrid },
  { path: '/alerts', label: 'Alerts', icon: HiBell },
  { path: '/setup/income', label: 'Income', icon: HiCurrencyDollar },
];

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <HiCurrencyDollar className="sidebar-brand-icon" />
          <span>Expense Tracker</span>
        </div>
        <div className="sidebar-section-label">Main</div>
        {mainNav.map((item) => (
          <div
            key={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <item.icon className="sidebar-icon" />
            <span>{item.label}</span>
          </div>
        ))}
        <div className="sidebar-section-label">More</div>
        {sidebarExtra.map((item) => (
          <div
            key={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <item.icon className="sidebar-icon" />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Mobile Bottom Nav */}
      <div className="bottom-nav">
        {mainNav.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <item.icon className="nav-icon" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default BottomNav;
