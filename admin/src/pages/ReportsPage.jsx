import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);

  const load = () => {
    api.get('/api/admin/reports').then(({ data }) => setReports(data.reports)).catch((err) => console.error(err));
  };
  useEffect(load, []);

  const act = async (id, action) => {
    await api.post(`/api/admin/reports/${id}/${action}`, {});
    load();
  };

  return (
    <div>
      <h1>Reports &amp; Moderation</h1>
      <table className="table">
        <thead>
          <tr><th>Reporter</th><th>Target</th><th>Reason</th><th>Details</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>{r.reporter.name}</td>
              <td>{r.targetType}:{r.targetId}</td>
              <td>{r.reason}</td>
              <td>{r.details || '—'}</td>
              <td><span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
              <td>
                <div className="inline-actions">
                  <button className="btn small green" onClick={() => act(r.id, 'resolve')}>Resolve</button>
                  <button className="btn small" onClick={() => act(r.id, 'dismiss')}>Dismiss</button>
                </div>
              </td>
            </tr>
          ))}
          {reports.length === 0 && <tr><td colSpan="6">No reports.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}