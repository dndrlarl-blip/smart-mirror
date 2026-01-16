import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Loader2 } from 'lucide-react';
import { sendMessageToAI } from '../services/chatService';
// import { v4 as uuidv4 } from 'uuid';

const SYSTEM_PROMPT = {
    role: 'system',
    content: 'You are a helpful AI assistant. You answer concisely and politely.'
};

const ChatComponent = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionId] = useState(() => 'session-' + Math.random().toString(36).substr(2, 9));
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setError(null);

        const historyForApi = newMessages.slice(-20);
        const messagesToSend = [SYSTEM_PROMPT, ...historyForApi];

        try {
            const result = await sendMessageToAI(messagesToSend, sessionId);
            const aiContent = result.choices?.[0]?.message?.content || "No response content.";

            setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
        } catch (err) {
            setError("Failed to get response after retries.");
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again.", isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="glass-panel" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '600px',
            width: '100%',
            maxWidth: '500px',
            overflow: 'hidden'
        }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={20} color="var(--accent-primary)" />
                    MiniMax AI Chat
                </h3>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
                        <p>Start a conversation!</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        gap: '12px',
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%'
                    }}>
                        {msg.role !== 'user' && (
                            <div style={{
                                minWidth: '32px', height: '32px', borderRadius: '50%',
                                background: msg.isError ? '#ef4444' : 'var(--accent-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {msg.isError ? <AlertCircle size={16} /> : <Bot size={16} />}
                            </div>
                        )}

                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '16px',
                            background: msg.role === 'user' ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.1)',
                            borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                            borderTopLeftRadius: msg.role === 'user' ? '16px' : '4px',
                            color: 'white',
                            lineHeight: '1.5'
                        }}>
                            {msg.content}
                        </div>

                        {msg.role === 'user' && (
                            <div style={{
                                minWidth: '32px', height: '32px', borderRadius: '50%',
                                background: '#3f3f46',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <User size={16} />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
                        <div style={{
                            minWidth: '32px', height: '32px', borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Loader2 size={16} className="animate-spin" />
                        </div>
                        <div style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        className="glass-input"
                        style={{ flex: 1 }}
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <button
                        className="primary-btn"
                        onClick={handleSend}
                        disabled={isLoading}
                        style={{ padding: '0 16px', opacity: isLoading ? 0.7 : 1 }}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
            <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default ChatComponent;
