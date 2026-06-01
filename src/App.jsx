import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Guidelines from './pages/Guidelines';
import Tools from './pages/Tools';    // new
import Sync from './pages/Sync';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

function Layout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

  return (
    <div>
      <Navbar onToggleSidebar={toggleSidebar} />
      <div className="columns is-gapless" style={{ margin: 0 }}>
        <div className={`column is-2-desktop ${sidebarVisible ? '' : 'is-hidden-mobile'}`}>
          <Sidebar visible={sidebarVisible} />
        </div>
        <div className="column">
          <section className="section">
            <Routes>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="categories" element={<Categories />} />
              <Route path="guidelines" element={<Guidelines />} />
              <Route path="tools" element={<Tools />} />   {/* new */}
              <Route path="sync" element={<Sync />} />
            </Routes>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
