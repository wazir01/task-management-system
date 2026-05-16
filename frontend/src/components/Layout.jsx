import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" end className="logo logo-compact">
          TN
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/projects">Projects</NavLink>
          {user?.isAdminAnywhere && <NavLink to="/members">Members</NavLink>}
        </nav>
        <NotificationBell />
        <div className="user-block">
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: '0.75rem', width: '100%' }} onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
