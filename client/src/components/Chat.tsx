import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';
import { ChatMessage } from '@rage-arena/shared';
import { MessageSquare, X } from 'lucide-react';

export const Chat = () => {
    const { roomCode, playerName } = useStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // To show brief popup notifications for new messages when closed
    const [latestMsg, setLatestMsg] = useState<ChatMessage | null>(null);

    useEffect(() => {
        socket.on('chat-message', (msg: ChatMessage) => {
            setMessages(p => [...p.slice(-49), msg]); // keep max 50
            if (!isOpen) {
                setLatestMsg(msg);
                setTimeout(() => {
                    setLatestMsg(current => current?.id === msg.id ? null : current);
                }, 4000);
            }
        });
        return () => {
            socket.off('chat-message');
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const send = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim() || !roomCode) return;
        socket.emit('chat-message', { code: roomCode, text });
        setText('');
    };

    return (
        <div className="absolute bottom-4 left-4 z-40 flex flex-col justify-end">

            {/* Floating latest message preview */}
            {!isOpen && latestMsg && (
                <div className="mb-2 bg-black/70 text-white px-4 py-2 rounded-lg border border-gray-700 animate-[fadeIn_0.3s_ease-out] max-w-xs shadow-lg backdrop-blur-sm">
                    <span className="font-bold text-red-400">{latestMsg.sender}: </span>
                    <span>{latestMsg.text}</span>
                </div>
            )}

            {isOpen ? (
                <div className="w-80 h-96 bg-gray-900/90 border border-gray-700 rounded-xl flex flex-col overflow-hidden backdrop-blur-md shadow-2xl animate-[slideUp_0.2s_ease-out]">
                    <div className="bg-gray-800 p-3 flex justify-between items-center border-b border-gray-700">
                        <h3 className="font-bold font-mono tracking-widest text-sm flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> ROOM CHAT
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                        {messages.map(m => (
                            <div key={m.id} className="text-sm">
                                <span className={`font-bold ${m.sender === playerName ? 'text-cyan-400' : 'text-red-400'}`}>
                                    {m.sender}:
                                </span> <span className="text-gray-200">{m.text}</span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={send} className="p-3 bg-gray-800/50 border-t border-gray-700 flex gap-2">
                        <input
                            type="text"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Chat... (Enter to send)"
                            className="flex-1 bg-black/50 border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-red-500"
                            maxLength={100}
                        />
                    </form>
                </div>
            ) : (
                <button
                    onClick={() => { setIsOpen(true); setLatestMsg(null); }}
                    className="bg-gray-800/80 hover:bg-gray-700/90 text-white p-3 rounded-full border border-gray-600 backdrop-blur-sm transition-transform hover:scale-110 shadow-lg"
                >
                    <MessageSquare className="w-6 h-6" />
                </button>
            )}
        </div>
    );
};
