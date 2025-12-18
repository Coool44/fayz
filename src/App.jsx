import React from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import CalculatorPage from './pages/CalculatorPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-left">
            <img className="brand-logo" src="/logo.jpeg" alt="Atlas" />
            <div className="brand-title">
              <strong>أطلس للصرافة</strong>
              <span>حساب التحويلات بسرعة وأمان</span>
            </div>
          </div>

          <nav className="nav">
            <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/">الحاسبة</NavLink>
            <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/admin">الإدارة</NavLink>
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<CalculatorPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
