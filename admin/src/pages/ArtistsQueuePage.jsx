import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ArtistsQueuePage() {
  const [artists, setArtists] = useState([]);
  const [filter, setFilter] = useState('');

  const load = async (status = filter) => {
    const { data } = await api.get('/api/admin/artists', { params: status ? { status } : {} });
    setArtists(data.artists);
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1>Artist Verification Queue</h1>
      <div className="filters">
        <button onClick={() => { setFilter(''); load(''); }}>All</button>
        <button onClick={() => { setFilter('PENDING'); load('PENDING'); }}>Pending</button>
        <button onClick={() => { setFilter('VERIFIED'); load('VERIFIED'); }}>Verified</button>
        <button onClick={() => { setFilter('MORE_INFO'); load('MORE_INFO'); }}>More info</button>
        <button onClick={() => { setFilter('REJECTED'); load('REJECTED'); }}>Rejected</button>
      </div>

      <table className="table">
        <thead>
          <tr><th>Artist</th><th>Category</th><th>Social</th><th>Code</th><th>Submitted</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {artists.map((a) => (
            <tr key={a.id}>
              <td><Link to={`/artists/${a.id}`}>{a.displayName}</Link><br /><small>{a.user.email}</small></td>
              <td>{a.category}</td>
              <td>{a.socialProfileUrl ? <a href={a.socialProfileUrl} target="_blank" rel="noreferrer">view</a> : '—'}</td>
              <td><code>{a.verificationCode}</code></td>
              <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
              <td><span className={`badge ${a.verificationStatus.toLowerCase()}`}>{a.verificationStatus}</span></td>
              <td><Link to={`/artists/${a.id}`}>Review</Link></td>
            </tr>
          ))}
          {artists.length === 0 && <tr><td colSpan="7">No applications.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}