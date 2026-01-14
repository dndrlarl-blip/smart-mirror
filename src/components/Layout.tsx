import React from 'react';
import { Camera, MessageSquare } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: 'facemesh' | 'chat';
    onTabChange: (tab: 'facemesh' | 'chat') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
    return (
        <div className="flex-col" style={{ minHeight: '100vh', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <header className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.5rem', background: 'linear-gradient(to right, #fff, #aaa)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                    FaceMessage
                </div>
                <nav style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className={`btn-secondary ${activeTab === 'facemesh' ? 'active' : ''}`}
                        style={{ borderColor: activeTab === 'facemesh' ? 'var(--neon-accent)' : undefined, color: activeTab === 'facemesh' ? 'var(--neon-accent)' : undefined }}
                        onClick={() => onTabChange('facemesh')}
                    >
                        <Camera size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Face Filter
                    </button>
                    <button
                        className={`btn-secondary ${activeTab === 'chat' ? 'active' : ''}`}
                        style={{ borderColor: activeTab === 'chat' ? 'var(--neon-secondary)' : undefined, color: activeTab === 'chat' ? 'var(--neon-secondary)' : undefined }}
                        onClick={() => onTabChange('chat')}
                    >
                        <MessageSquare size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Groq Chat
                    </button>
                </nav>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
            </main>

            <footer style={{ marginTop: '2rem', color: '#666', fontSize: '0.8rem' }}>
                Powered by MediaPipe & Groq & Supabase
            </footer>
        </div>
    );
};
