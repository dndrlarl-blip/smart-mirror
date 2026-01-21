import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, Send, Loader2, Bot, User } from 'lucide-react';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid'; // Actually we need uuid pkg or simple random logic. I'll use simple math if uuid not installed, but I didn't install uuid. I'll use native random. 
// Wait, I can't import v4 if not installed. I'll use crypto.randomUUID() if available or Math.

export default function ChatSection() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);
    const sessionIdRef = useRef('');

    useEffect(() => {
        // Generate session ID on mount
        sessionIdRef.current = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

        // Add initial greeting
        setMessages([{ role: 'assistant', content: '안녕하세요! 무엇을 도와드릴까요?' }]);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare history: last 10 turns. (Prompt: 10 turns)
            // A turn is usually user+assistant. So 20 messages.
            const history = messages.slice(-20);

            const response = await axios.post('/api/chat', {
                messages: [...history, userMsg],
                session_id: sessionIdRef.current
            });

            const aiMsg = response.data; // { role: 'assistant', content: '...', usage: ... }
            setMessages(prev => [...prev, { role: 'assistant', content: aiMsg.content }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                <MessageCircle className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold">AI Assistant</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar text-sm" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={clsx("flex gap-2 max-w-[90%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}>
                        <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", msg.role === 'user' ? "bg-blue-600" : "bg-green-600")}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={clsx("p-2 rounded-xl text-gray-100 whitespace-pre-wrap leading-relaxed", msg.role === 'user' ? "bg-blue-900 rounded-tr-none" : "bg-gray-800 rounded-tl-none")}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-2 mr-auto items-center text-xs text-gray-500">
                        <Bot size={16} />
                        <Loader2 className="animate-spin w-4 h-4" />
                        <span>답변 생성 중...</span>
                    </div>
                )}
            </div>

            <div className="mt-3 relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="메시지를 입력하세요..."
                    className="w-full bg-gray-800 border-none rounded-full py-3 px-4 pr-12 text-white focus:ring-2 focus:ring-green-500 outline-none"
                    disabled={isLoading}
                />
                <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-green-600 hover:bg-green-500 rounded-full disabled:opacity-50 transition"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
}
