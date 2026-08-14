import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [note, setNote] = useState('');

  const load = async () => {
    const { data } = await api.get(`/api/admin/orders/${id}`);
    setOrder(data.order);
  };

  useEffect(() => { load().catch(() => navigate('/orders')); }, [id]);

  const act = async (action) => {
    await api.post(`/api/admin/orders/${id}/${action}`, { note });
    load();
  };

  const reviewEvidence = async (evidenceId) => {
    await api.post(`/api/admin/evidence/${evidenceId}/review`);
    load();
  };

  if (!order) return <div className="loading">Loading…</div>;

  return (
    <div>
      <h1>{order.title}</h1>
      <p>
        <span className={`badge ${order.status.toLowerCase()}`}>{order.status}</span>{' '}
        <span className={`badge ${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus}</span>
      </p>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Parties</h3>
          <p><strong>Buyer:</strong> {order.buyer.name} ({order.buyer.email})</p>
          <p><strong>Artist:</strong> {order.artist.user.name} ({order.artist.user.email})</p>
          <p><strong>Amount:</strong> ${Number(order.amount).toFixed(2)}</p>
          {order.product && <p><strong>Product:</strong> {order.product.title}</p>}
        </div>
        <div className="detail-card">
          <h3>Timeline</h3>
          <ul className="timeline">
            {order.timeline.map((t) => (
              <li key={t.id}>{new Date(t.createdAt).toLocaleString()} — {t.event}{t.note ? `: ${t.note}` : ''}</li>
            ))}
          </ul>
        </div>
      </div>

      <h2>Evidence</h2>
      <div className="detail-card">
        {order.evidence.map((e) => (
          <div key={e.id} className="evidence-row">
            <div>
              <span className={`badge ${e.phase.toLowerCase()}`}>{e.phase}</span>{' '}
              <span>by {e.uploader.name}</span>{' '}
              <span className="muted">{new Date(e.createdAt).toLocaleString()}</span>
              {e.reviewed && <span className="badge reviewed">Reviewed</span>}
            </div>
            <ul>
              {e.mediaUrls.map((url, i) => <li key={i}><a href={url} target="_blank" rel="noreferrer">media {i + 1}</a></li>)}
            </ul>
            {e.description && <p className="muted">{e.description}</p>}
            {!e.reviewed && <button className="btn" onClick={() => reviewEvidence(e.id)}>Mark reviewed</button>}
          </div>
        ))}
        {order.evidence.length === 0 && <p className="muted">No evidence uploaded yet.</p>}
      </div>

      <div className="detail-card">
        <label>Internal note
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="full" />
        </label>
        <div className="actions">
          <button className="btn green" onClick={() => act('mark-completed')}>Mark completed</button>
          <button className="btn amber" onClick={() => act('open-dispute')}>Open dispute</button>
          <button className="btn red" onClick={() => act('refund')}>Refund (demo)</button>
        </div>
      </div>
    </div>
  );
}