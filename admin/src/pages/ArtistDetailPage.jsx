import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function ArtistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.get(`/api/admin/artists/${id}`).then(({ data }) => {
      setArtist(data.artist);
      setNotes(data.artist.adminNotes || '');
    }).catch(() => navigate('/artists'));
  }, [id]);

  const act = async (action) => {
    await api.post(`/api/admin/artists/${id}/${action}`, { notes });
    navigate('/artists');
  };

  if (!artist) return <div className="loading">Loading…</div>;

  return (
    <div>
      <h1>{artist.displayName}</h1>
      <p><span className={`badge ${artist.verificationStatus.toLowerCase()}`}>{artist.verificationStatus}</span></p>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Application</h3>
          <p><strong>Category:</strong> {artist.category}</p>
          <p><strong>Bio:</strong> {artist.bio || '—'}</p>
          <p><strong>Verification code:</strong> <code>{artist.verificationCode}</code></p>
          <p><strong>Applied:</strong> {new Date(artist.appliedAt).toLocaleString()}</p>
        </div>
        <div className="detail-card">
          <h3>Contact</h3>
          <p><strong>Name:</strong> {artist.user.name}</p>
          <p><strong>Email:</strong> {artist.user.email}</p>
          <p><strong>Joined:</strong> {new Date(artist.user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="detail-card">
        <h3>Verification check</h3>
        <p>Confirm the submitted code <code>{artist.verificationCode}</code> appears on their social profile.</p>
        {artist.socialProfileUrl && <p><a href={artist.socialProfileUrl} target="_blank" rel="noreferrer">Open social profile</a></p>}
        {artist.portfolioUrl && <p><a href={artist.portfolioUrl} target="_blank" rel="noreferrer">Open portfolio</a></p>}
      </div>

      <div className="detail-card">
        <label>Internal notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="full" />
        </label>
        <div className="actions">
          <button className="btn green" onClick={() => act('approve')}>Approve</button>
          <button className="btn amber" onClick={() => act('request-info')}>Request more info</button>
          <button className="btn red" onClick={() => act('reject')}>Reject</button>
        </div>
      </div>
    </div>
  );
}