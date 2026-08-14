import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Session from 'supertokens-auth-react/recipe/session';
import FeedPage from './pages/FeedPage';
import ArtistApplyPage from './pages/ArtistApplyPage';
import ArtistProfilePage from './pages/ArtistProfilePage';
import ChatPage from './pages/ChatPage';
import api from './api/client';

export default function App() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (await Session.doesSessionExist()) {
          const { data } = await api.post('/api/auth/session', {});
          setMe(data.user);
        }
      } catch (err) {
        console.error('session fetch failed', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="app-loading">Loading Artisthive…</div>;

  return (
    <div className="app">
      <nav className="topnav">
        <Link to="/" className="brand">Artisthive</Link>
        {me && (
          <div className="nav-links">
            <Link to="/apply">Become an Artist</Link>
            <Link to="/chat">Chat</Link>
            <button onClick={() => Session.signOut()}>Sign out</button>
          </div>
        )}
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<FeedPage me={me} />} />
          <Route path="/apply" element={<ArtistApplyPage me={me} />} />
          <Route path="/artist/:id" element={<ArtistProfilePage />} />
          <Route path="/chat" element={<ChatPage me={me} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}