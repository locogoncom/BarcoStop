import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader } from './ui/Card';
import { X, Mail } from 'lucide-react';

interface InviteFriendsProps {
  onInvite: (email: string) => void;
  onClose: () => void;
}

export function InviteFriends({ onInvite, onClose }: InviteFriendsProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');

  const handleAddEmail = () => {
    if (newEmail.trim() && newEmail.includes('@')) {
      setEmails([...emails, newEmail.trim()]);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleSendInvites = () => {
    emails.forEach((email) => onInvite(email));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex items-center justify-between pb-3">
          <h2 className="text-xl font-bold text-gray-900">Invita amigos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Invita a tus amigos a BarcoStop y que creen su cuenta gratis.
          </p>

          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <Button onClick={handleAddEmail} size="icon">
                <Mail size={18} />
              </Button>
            </div>

            {emails.length > 0 && (
              <div className="space-y-1">
                {emails.map((email, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-blue-50 p-2 rounded"
                  >
                    <span className="text-sm text-gray-900">{email}</span>
                    <button
                      onClick={() => handleRemoveEmail(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSendInvites}
              disabled={emails.length === 0}
              className="flex-1"
            >
              Enviar invitaciones ({emails.length})
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
