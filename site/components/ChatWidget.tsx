'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I am Arnaud's Digital Twin. Ask me about Data & AI strategy, my career journey, or my profound love for wine, ski, and travel! (I happen to know as much about wine as Jancis Robinson!)" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages.map(m => ({ role: m.role, content: m.content })) })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "System error: connection to my twin's consciousness failed." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Network error: unable to reach digital proxy." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: 'var(--accent)',
          border: 'none',
          color: 'white',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          boxShadow: '0 10px 20px var(--accent-glow)',
          cursor: 'pointer',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          transition: 'transform 0.3s ease'
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '6rem',
          right: '2rem',
          width: '350px',
          height: '500px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 99,
          overflow: 'hidden',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-edgy) 100%)',
            padding: '1rem',
            color: 'white',
            fontWeight: 'bold',
            fontFamily: "'Space Grotesk', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
             🤖 Arnaud's Digital Twin
          </div>

          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255,255,255,0.05)',
                border: msg.role === 'user' ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                maxWidth: '85%',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                color: 'var(--text-primary)'
              }}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
              }}>
                Twin is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} style={{
            padding: '1rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '0.5rem',
            background: 'rgba(0,0,0,0.3)'
          }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                color: 'white',
                padding: '0.8rem',
                borderRadius: '4px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <button type="submit" style={{
              background: 'var(--accent)',
              border: 'none',
              color: 'white',
              padding: '0 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
