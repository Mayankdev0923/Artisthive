import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api/client';

export default function ChatPage({ me }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);

  const loadConversations = async () => {
    const { data } = await api.get('/api/conversations');
    setConversations(data.conversations);
  };

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000', {
      auth: { userId: me?.id },
    });
    socketRef.current = socket;

    socket.on('message:new', ({ conversationId, message }) => {
      if (conversationId === activeId) {
        setMessages((prev) => [...prev, message]);
      } else {
        loadConversations();
      }
    });

    return () => socket.disconnect();
  }, [me?.id, activeId]);

  const openConversation = async (otherUserId) => {
    const { data } = await api.post('/api/conversations', { userId: otherUserId });
    setActiveId(data.conversation.id);
    setMessages(data.conversation.messages?.length ? [data.conversation.messages[0]] : []);
    const history = await api.get(`/api/conversations/${data.conversation.id}/messages`);
    setMessages(history.data.messages);
    socketRef.current?.emit('conversation:join', data.conversation.id);
    loadConversations();
  };

  const send = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeId) return;
    socketRef.current?.emit('message:send', { conversationId: activeId, content: input }, (ack) => {
      if (ack?.ok) {
        setMessages((prev) => [...prev, ack.message]);
      } else if (ack?.error) {
        console.error('send failed', ack.error);
      }
    });
    setInput('');
  };

  return (
    <div className="page chat-layout">
      <aside className="conversation-list">
        <h2>Messages</h2>
        {conversations.map((c) => {
          const other = c.participants.find((p) => p.user.id !== me?.id)?.user;
          const last = c.messages[0];
          return (
            <button key={c.id} className="conv-item" onClick={() => openConversation(other.id)}>
              <strong>{other?.name}</strong>
              <span>{last?.content}</span>
            </button>
          );
        })}
        {conversations.length === 0 && <p>No conversations yet.</p>}
      </aside>

      <section className="chat-window">
        {activeId ? (
          <>
            <div className="message-list">
              {messages.map((m) => (
                <div key={m.id} className={`message ${m.senderId === me?.id ? 'mine' : ''}`}>
                  <span className="msg-name">{m.sender?.name}</span>
                  <p>{m.content}</p>
                </div>
              ))}
            </div>
            <form className="chat-input" onSubmit={send}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <p className="chat-empty">Select a conversation to start chatting.</p>
        )}
      </section>
    </div>
  );
}