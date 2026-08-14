import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ArtistApplyPage({ me }) {
  const [form, setForm] = useState({ category: 'PAINTER', displayName: '', bio: '', socialProfileUrl: '', portfolioUrl: '' });
  const [result, setResult] = useState(null);
  const [existing, setExisting] = useState(null);

  useEffect(() => {
    api.get('/api/artists/me').then(({ data }) => setExisting(data.artistProfile)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/api/artists/apply', form);
    setResult(data);
  };

  return (
    <div className="page">
      <h1>Become an Artist</h1>

      {existing && (
        <div className="status-card">
          <p>Application status: <strong>{existing.verificationStatus}</strong></p>
          {existing.verificationCode && (
            <p>Verification code: <code>{existing.verificationCode}</code></p>
          )}
          <p>Post this code on your submitted social profile so our team can verify you control it.</p>
        </div>
      )}

      {result?.verificationCode && (
        <div className="status-card">
          <p>Submitted! Your verification code is <code>{result.verificationCode}</code></p>
          <p>Place it on your social profile (e.g. bio or a post), then wait for review.</p>
        </div>
      )}

      <form className="form" onSubmit={submit}>
        <label>Artist category
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {['MUSICIAN','SINGER','BAND','DJ','PAINTER','PHOTOGRAPHER','DANCER','PERFORMER','SCULPTOR','CRAFTS','DIGITAL_ARTIST','FILM_MAKER','WRITER','POET','OTHER'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>Display name
          <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </label>
        <label>Bio
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
        </label>
        <label>Social profile URL
          <input value={form.socialProfileUrl} onChange={(e) => setForm({ ...form, socialProfileUrl: e.target.value })} placeholder="https://instagram.com/…" />
        </label>
        <label>Portfolio / work URL
          <input value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} />
        </label>
        <button type="submit">Submit application</button>
      </form>
    </div>
  );
}