import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    api.get('/api/admin/dashboard').then(({ data }) => {
      setStats(data.stats);
      setActivity(data.recentActivity);
    }).catch((err) => console.error(err));
  }, []);

  if (!stats) return <div className="loading">Loading…</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card"><span className="num">{stats.pendingArtists}</span><span>Pending artists</span></div>
        <div className="stat-card"><span className="num">{stats.activeOrders}</span><span>Active orders</span></div>
        <div className="stat-card"><span className="num">{stats.openDisputes}</span><span>Open disputes</span></div>
        <div className="stat-card"><span className="num">{stats.openReports}</span><span>Open reports</span></div>
      </div>

      <h2>Recent activity</h2>
      <table className="table">
        <thead><tr><th>Time</th><th>Admin</th><th>Action</th></tr></thead>
        <tbody>
          {activity.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.createdAt).toLocaleString()}</td>
              <td>{a.adminEmail}</td>
              <td>{a.action}</td>
            </tr>
          ))}
          {activity.length === 0 && <tr><td colSpan="3">No activity yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}