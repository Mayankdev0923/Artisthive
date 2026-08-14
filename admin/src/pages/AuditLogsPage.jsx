import { useEffect, useState } from 'react';
import api from '../api/client';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/api/admin/audit-logs').then(({ data }) => setLogs(data.logs)).catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Audit Logs</h1>
      <table className="table">
        <thead>
          <tr><th>Time</th><th>Admin</th><th>Action</th><th>Entity</th><th>Details</th></tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.createdAt).toLocaleString()}</td>
              <td>{l.adminEmail}</td>
              <td>{l.action}</td>
              <td>{l.entityType ? `${l.entityType}:${l.entityId}` : '—'}</td>
              <td>{l.details || '—'}</td>
            </tr>
          ))}
          {logs.length === 0 && <tr><td colSpan="5">No audit logs.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}