import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function ArtistProfilePage() {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);

  useEffect(() => {
    api.get(`/api/artists/${id}`).then(({ data }) => setArtist(data.artistProfile)).catch(() => {});
  }, [id]);

  if (!artist) return <div className="page">Loading artist…</div>;

  return (
    <div className="page">
      <div className="profile-header">
        <h1>{artist.displayName}</h1>
        {artist.verificationStatus === 'VERIFIED' && <span className="badge verified">Verified ✓</span>}
        <p>{artist.category}</p>
        {artist.bio && <p>{artist.bio}</p>}
        {artist.socialProfileUrl && <a href={artist.socialProfileUrl} target="_blank" rel="noreferrer">Social profile</a>}
      </div>

      <h2>Products</h2>
      <div className="grid">
        {artist.products.map((product) => (
          <div key={product.id} className="card">
            <h3>{product.title}</h3>
            <p>${Number(product.price).toFixed(2)}</p>
          </div>
        ))}
        {artist.products.length === 0 && <p>No products yet.</p>}
      </div>
    </div>
  );
}