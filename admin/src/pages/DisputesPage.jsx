import { useEffect, useState } from 'react';
import api from '../api/client';

export default function DisputesPage() {
  const [disputes, setDisputes] = useState([]);

  const load = () => {
    api.get('/api/admin/disputes').then(({ data }) => setDisputes(data.disputes)).catch((err) => console.error(err));
  };
  useEffect(load, []);

  const update = async (id, payload) => {
    await api.post(`/api/admin/disputes/${id}`, payload);
    load();
  };

  return (
    <div>
      <h1>Disputes</h1>
      <table className="table">
        <thead>
          <tr><th>Order</th><th>Opened by</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {disputes.map((d) => (
            <tr key={d.id}>
              <td>{d.order?.title}</td>
              <td>{d.openedBy.name}</td>
              <td>{d.reason}</td>
              <td><span className={`badge ${d.status.toLowerCase()}`}>{d.status}</span></td>
              <td>
                <div className="inline-actions">
                  <button className="btn small" onClick={() => update(d.id, { status: 'UNDER_REVIEW' })}>Review</button>
                  <button className="btn small green" onClick={() => update(d.id, { status: 'RESOLVED' })}>Resolve</button>
                  <button className="btn small amber" onClick={() => update(d.id, { status: 'WAITING_FOR_ARTIST' })}>Wait artist</button>
                  <button className="btn small amber" onClick={() => update(d.id, { status: 'WAITING_FOR_BUYER' })}>Wait buyer</button>
                  <button className="btn small red" onClick={() => update(d.id, { status: 'CLOSED' })}>Close</button>
                </div>
              </td>
            </tr>
          ))}
          {disputes.length === 0 && <tr><td colSpan="5">No disputes.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}