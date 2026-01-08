
import React, { useState, useRef, useEffect } from 'react';

function ChatInterface() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'system', content: 'You are a helpful AI assistant for the FaceMesh App.' } // Initial system prompt
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        const newHistory = [...messages, userMsg];

        // Keep only last 10 turns (plus system prompt at index 0)
        // 10 turns = 20 messages approximately.
        // We want to keep established context.
        const contextWindow = newHistory.length > 21
            ? [newHistory[0], ...newHistory.slice(-20)]
            : newHistory;

        setMessages(contextWindow);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: contextWindow }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            const botMsg = { role: 'assistant', content: data.reply };
            setMessages(prev => [...prev, botMsg]);

            if (data.usage) {
                console.log(`[Usage] Total: ${data.usage.total_tokens}`);
            }

        } catch (err) {
            console.error(err);
            setError("Failed to get response. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-container">
            {/* Floating Button */}
            {!isOpen && (
                <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
                    💬
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <h3>AI Assistant</h3>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
                    </div>

                    <div className="chat-messages">
                        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role}`}>
                                <div className="message-content">{msg.content}</div>
                            </div>
                        ))}
                        {isLoading && <div className="message assistant loading">...</div>}
                        {error && (
                            <div className="error-banner">
                                {error}
                                <button onClick={handleSend} className="retry-btn">Retry</button>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask anything..."
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()}>
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatInterface;
