import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, Loader } from 'lucide-react';
import { sendMessageToGroq } from '../../services/groqService';
import type { ChatMessage } from '../../services/groqService';

export const ChatContainer: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'system', content: 'You are a helpful assistant. You answer in Korean.' },
        { role: 'assistant', content: '안녕하세요! 무엇을 도와드릴까요?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: input };
        const newHistory = [...messages, userMsg];

        // Memory Limit: Keep system prompt + last 10 turns (20 messages)
        // If > 21 (1 system + 20), slice.
        // Actually simplest is: System + last N.
        let apiHistory = newHistory;
        if (newHistory.length > 21) {
            apiHistory = [newHistory[0], ...newHistory.slice(newHistory.length - 20)];
        }

        setMessages(newHistory);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const responseContent = await sendMessageToGroq(apiHistory);
            const assistantMsg: ChatMessage = { role: 'assistant', content: responseContent };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err: any) {
            console.error(err);
            setError('Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '600px', maxWidth: '100%', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: 0, color: '#bd00ff' }}>Neural Chat</h3>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.filter(m => m.role !== 'system').map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            padding: '10px 15px',
                            borderRadius: '12px',
                            background: msg.role === 'user' ? 'linear-gradient(135deg, #00f2ff22, #00a8ff22)' : 'rgba(255,255,255,0.05)',
                            border: msg.role === 'user' ? '1px solid #00f2ff44' : '1px solid #ffffff11',
                            color: '#fff'
                        }}
                    >
                        {msg.content}
                    </div>
                ))}

                {isLoading && (
                    <div style={{ alignSelf: 'flex-start', padding: '10px' }}>
                        <Loader className="animate-spin" size={20} color="#bd00ff" style={{ animation: 'spin 1s linear infinite' }} />
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {error && (
                    <div style={{ alignSelf: 'center', color: '#ff4444', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>

            {/* Input */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '10px' }}>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={isLoading}
                    style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        padding: '10px',
                        color: 'white',
                        resize: 'none',
                        height: '50px',
                        fontFamily: 'inherit'
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="btn-primary"
                    style={{ height: '50px', width: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};
