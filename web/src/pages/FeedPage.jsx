import { useEffect, useState } from 'react';
import api from '../api/client';

export default function FeedPage({ me }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [nextCursor, setNextCursor] = useState(null);

  const load = async (cursor) => {
    const { data } = await api.get('/api/posts', { params: { cursor } });
    setPosts((prev) => (cursor ? [...prev, ...data.posts] : data.posts));
    setNextCursor(data.nextCursor);
  };

  useEffect(() => { load(); }, []);

  const createPost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    const { data } = await api.post('/api/posts', { content });
    setPosts((prev) => [data.post, ...prev]);
    setContent('');
  };

  return (
    <div className="page">
      <h1>Discover artists</h1>

      {me && (
        <form className="composer" onSubmit={createPost}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something about art…"
            rows={3}
          />
          <button type="submit">Post</button>
        </form>
      )}

      <div className="feed">
        {posts.map((post) => (
          <article key={post.id} className="post">
            <div className="post-meta">
              <strong>{post.author.name}</strong>
              <span>{new Date(post.createdAt).toLocaleString()}</span>
            </div>
            <p>{post.content}</p>
            <div className="post-footer">
              <span>{post._count.appreciations} applause</span>
            </div>
          </article>
        ))}
      </div>

      {nextCursor && <button onClick={() => load(nextCursor)}>Load more</button>}
    </div>
  );
}