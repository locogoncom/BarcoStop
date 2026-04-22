import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader } from './ui/Card';
import { X, Mail } from 'lucide-react';
export function InviteFriends({ onInvite, onClose }) {
    const [emails, setEmails] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const handleAddEmail = () => {
        if (newEmail.trim() && newEmail.includes('@')) {
            setEmails([...emails, newEmail.trim()]);
            setNewEmail('');
        }
    };
    const handleRemoveEmail = (index) => {
        setEmails(emails.filter((_, i) => i !== index));
    };
    const handleSendInvites = () => {
        emails.forEach((email) => onInvite(email));
        onClose();
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "flex items-center justify-between pb-3", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Invita amigos" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { size: 20 }) })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Invita a tus amigos a BarcoStop y que creen su cuenta gratis." }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("div", { className: "flex-1", children: _jsx(Input, { type: "email", value: newEmail, onChange: (e) => setNewEmail(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleAddEmail(), placeholder: "email@ejemplo.com" }) }), _jsx(Button, { onClick: handleAddEmail, size: "icon", children: _jsx(Mail, { size: 18 }) })] }), emails.length > 0 && (_jsx("div", { className: "space-y-1", children: emails.map((email, idx) => (_jsxs("div", { className: "flex items-center justify-between bg-blue-50 p-2 rounded", children: [_jsx("span", { className: "text-sm text-gray-900", children: email }), _jsx("button", { onClick: () => handleRemoveEmail(idx), className: "text-red-600 hover:text-red-800", children: _jsx(X, { size: 16 }) })] }, idx))) }))] }), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsxs(Button, { onClick: handleSendInvites, disabled: emails.length === 0, className: "flex-1", children: ["Enviar invitaciones (", emails.length, ")"] }), _jsx(Button, { variant: "outline", onClick: onClose, className: "flex-1", children: "Cerrar" })] })] })] }) }));
}
