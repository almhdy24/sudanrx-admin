import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [burgerActive, setBurgerActive] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="navbar is-primary" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        {/* Logo + brand */}
        <a className="navbar-item" href="/dashboard">
          <img src="/logo.svg" alt="SudanRx Logo" width="28" height="28" style={{ marginRight: '0.5rem' }} />
          <span className="has-text-weight-bold">SudanRx Admin</span>
        </a>

        {/* Hamburger for mobile */}
        <a
          role="button"
          className={`navbar-burger ${burgerActive ? 'is-active' : ''}`}
          aria-label="menu"
          aria-expanded={burgerActive}
          onClick={() => {
            setBurgerActive(!burgerActive);
            onToggleSidebar && onToggleSidebar(); // notify parent to toggle sidebar
          }}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div className={`navbar-menu ${burgerActive ? 'is-active' : ''}`}>
        <div className="navbar-end">
          {session && (
            <div className="navbar-item">
              <span className="mr-3">{session.user.email}</span>
              <button className="button is-light" onClick={handleLogout}>
                <span className="icon"><i className="fas fa-sign-out-alt"></i></span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
