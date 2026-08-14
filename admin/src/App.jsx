import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ArtistsQueuePage from './pages/ArtistsQueuePage';
import ArtistDetailPage from './pages/ArtistDetailPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import DisputesPage from './pages/DisputesPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogsPage from './pages/AuditLogsPage';

export default function App() {
  return (
    <div className="admin-app">
      <aside className="sidebar">
        <div className="brand">Artisthive Admin</div>
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/artists">Artist Verification</NavLink>
        <NavLink to="/orders">Orders</NavLink>
        <NavLink to="/disputes">Disputes</NavLink>
        <NavLink to="/reports">Reports</NavLink>
        <NavLink to="/audit">Audit Logs</NavLink>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/artists" element={<ArtistsQueuePage />} />
          <Route path="/artists/:id" element={<ArtistDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/disputes" element={<DisputesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/audit" element={<AuditLogsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}