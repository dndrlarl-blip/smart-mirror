import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg].slice(-10); // Keep last 10
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages })
            });

            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();

            // Adapt based on actual MiniMax response structure
            // Assuming standard choices[0].message
            const botContent = data.choices?.[0]?.message?.content || "No response";
            const usage = data.usage || { total_tokens: 0 };

            setMessages(prev => [...prev, { role: 'assistant', content: botContent }]);

            // Log usage
            logUsage(newMessages.length, botContent.length, usage);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'system', content: "Error: Could not get response." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const logUsage = async (inputLen, outputLen, usage) => {
        // Log to local state for display
        const logItem = `In: ${inputLen} chars, Out: ${outputLen} chars. Tokens: ${usage.total_tokens}`;
        setLogs(prev => [logItem, ...prev]);

        // Log to Supabase if table exists
        try {
            await supabase.from('chat_logs').insert([{
                created_at: new Date(),
                input_length: inputLen,
                output_length: outputLen,
                tokens: usage.total_tokens
            }]);
        } catch (e) {
            console.warn("Supabase logging failed", e);
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-900 text-white border-l border-r border-gray-700">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-xs ${m.role === 'user' ? 'bg-blue-600' : m.role === 'system' ? 'bg-red-900' : 'bg-gray-700'}`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && <div className="text-gray-400 text-sm animate-pulse">Minimax is typing...</div>}
            </div>

            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-gray-900 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded transition-colors"
                    >
                        Send
                    </button>
                </div>
            </div>

            {/* Logs Overlay */}
            <div className="h-32 bg-black/80 overflow-y-auto p-2 text-xs font-mono text-green-400 border-t border-gray-700">
                <h3 className="font-bold border-b border-gray-700 mb-1">Usage Logs</h3>
                {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
        </div>
    );
};

export default Chat;
