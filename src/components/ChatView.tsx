import React, { useState } from 'react';
import { Message, User, Conversation } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Send, X } from 'lucide-react';

interface ChatViewProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  users: User[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

export function ChatView({
  conversation,
  messages,
  currentUserId,
  users,
  onSendMessage,
  onClose,
}: ChatViewProps) {
  const [messageText, setMessageText] = useState('');

  const otherUserId = conversation.participants.find((p) => p !== currentUserId);
  const otherUser = users.find((u) => u.id === otherUserId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md h-[600px] flex flex-col">
        <CardHeader className="flex items-center justify-between pb-3">
          <div>
            <h2 className="font-bold text-gray-900">{otherUser?.name || 'Chat'}</h2>
            <p className="text-xs text-gray-500">{otherUser?.role === 'patron' ? 'Patrón' : 'Viajero'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">
                Inicia la conversación
              </p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.senderId === currentUserId;
                const sender = users.find((u) => u.id === msg.senderId);

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-medium mb-1">{sender?.name}</p>
                      )}
                      <p className="text-sm break-words">{msg.text}</p>
                      <p className={`text-xs mt-1 ${
                        isOwn ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {new Date(msg.createdAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send size={18} />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
