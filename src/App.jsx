import React from 'react';
import FaceMeshComponent from './components/FaceMesh';
import ChatComponent from './components/Chat';

function App() {
  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', alignItems: 'center' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1>FaceMesh & <span style={{ color: 'var(--accent-primary)' }}>MiniMax</span> Chat</h1>
        <p style={{ color: 'var(--text-secondary)' }}>AI-Powered Face Filter & Intelligent Conversation</p>
      </header>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '32px',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '1200px'
      }}>
        {/* FaceMesh Section */}
        <section style={{ flex: '1 1 500px', display: 'flex', justifyContent: 'center' }}>
          <FaceMeshComponent />
        </section>

        {/* Chat Section */}
        <section style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
          <ChatComponent />
        </section>
      </div>

      <footer style={{ marginTop: '40px', color: 'var(--text-secondary)', fontSize: '0.9em' }}>
        <p>Built with React, MediaPipe, MiniMax & Supabase</p>
      </footer>
    </div>
  );
}

export default App;
