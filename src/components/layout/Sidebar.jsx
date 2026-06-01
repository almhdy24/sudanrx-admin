import { NavLink } from 'react-router-dom';

export default function Sidebar({ visible }) {
  return (
    <aside className={`menu p-4 sidebar ${visible ? '' : 'is-hidden-mobile'}`} style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <p className="menu-label">General</p>
      <ul className="menu-list">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'is-active' : ''}>
            <span className="icon"><i className="fas fa-tachometer-alt"></i></span> Dashboard
          </NavLink>
        </li>
      </ul>

      <p className="menu-label">Content</p>
      <ul className="menu-list">
        <li>
          <NavLink to="/categories" className={({ isActive }) => isActive ? 'is-active' : ''}>
            <span className="icon"><i className="fas fa-folder"></i></span> Categories
          </NavLink>
        </li>
        <li>
          <NavLink to="/guidelines" className={({ isActive }) => isActive ? 'is-active' : ''}>
            <span className="icon"><i className="fas fa-book-medical"></i></span> Guidelines
          </NavLink>
        </li>
      </ul>

      <p className="menu-label">Administration</p>
      <ul className="menu-list">
        <li>
          <NavLink to="/users" className={({ isActive }) => isActive ? 'is-active' : ''}>
            <span className="icon"><i className="fas fa-users"></i></span> Users
          </NavLink>
        </li>
      </ul>

      <p className="menu-label">Tools</p>
      <ul className="menu-list">
        <li>
          <NavLink to="/tools" className={({ isActive }) => isActive ? 'is-active' : ''}>
            <span className="icon"><i className="fas fa-tools"></i></span> Utilities
          </NavLink>
        </li>
      </ul>

      <p className="menu-label">Sync</p>
      <ul className="menu-list">
        <li>
          <NavLink to="/sync" className={({ isActive }) => isActive ? 'is-active' : ''}>
            <span className="icon"><i className="fas fa-sync-alt"></i></span> Sync Status
          </NavLink>
        </li>
      </ul>
    </aside>
  );
}
