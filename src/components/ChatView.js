import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Send, X } from 'lucide-react';
export function ChatView({ conversation, messages, currentUserId, users, onSendMessage, onClose, }) {
    const [messageText, setMessageText] = useState('');
    const otherUserId = conversation.participants.find((p) => p !== currentUserId);
    const otherUser = users.find((u) => u.id === otherUserId);
    const handleSend = (e) => {
        e.preventDefault();
        if (messageText.trim()) {
            onSendMessage(messageText.trim());
            setMessageText('');
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: _jsxs(Card, { className: "w-full max-w-md h-[600px] flex flex-col", children: [_jsxs(CardHeader, { className: "flex items-center justify-between pb-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-bold text-gray-900", children: otherUser?.name || 'Chat' }), _jsx("p", { className: "text-xs text-gray-500", children: otherUser?.role === 'patron' ? 'Patrón' : 'Viajero' })] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { size: 20 }) })] }), _jsxs(CardContent, { className: "flex-1 flex flex-col", children: [_jsx("div", { className: "flex-1 overflow-y-auto mb-4 space-y-3", children: messages.length === 0 ? (_jsx("p", { className: "text-center text-gray-500 text-sm py-8", children: "Inicia la conversaci\u00F3n" })) : (messages.map((msg) => {
                                const isOwn = msg.senderId === currentUserId;
                                const sender = users.find((u) => u.id === msg.senderId);
                                return (_jsx("div", { className: `flex ${isOwn ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-xs px-3 py-2 rounded-lg ${isOwn
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-900'}`, children: [!isOwn && (_jsx("p", { className: "text-xs font-medium mb-1", children: sender?.name })), _jsx("p", { className: "text-sm break-words", children: msg.text }), _jsx("p", { className: `text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-600'}`, children: new Date(msg.createdAt).toLocaleTimeString('es-ES', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }) })] }) }, msg.id));
                            })) }), _jsxs("form", { onSubmit: handleSend, className: "flex gap-2", children: [_jsx(Input, { value: messageText, onChange: (e) => setMessageText(e.target.value), placeholder: "Escribe tu mensaje...", className: "flex-1" }), _jsx(Button, { type: "submit", size: "icon", children: _jsx(Send, { size: 18 }) })] })] })] }) }));
}
