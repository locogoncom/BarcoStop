import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { RatingStars } from './RatingStars';
import { Select } from './ui/Select';
import { LogOut, Share2 } from 'lucide-react';
const AVAILABLE_SKILLS = [
    'Navegante',
    'Cocinero',
    'Mecánico',
    'Ayudante general',
    'Marinero',
    'Capitán',
    'Enfermero',
    'Instructor de vela',
];
export function Profile({ user, onUpdate, onLogout, onInviteClick, }) {
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(user.bio || '');
    const [selectedSkills, setSelectedSkills] = useState(user.skills || []);
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillLevel, setNewSkillLevel] = useState('principiante');
    const handleAddSkill = () => {
        if (newSkillName.trim()) {
            const skill = {
                name: newSkillName.trim(),
                level: newSkillLevel,
            };
            setSelectedSkills([...selectedSkills, skill]);
            setNewSkillName('');
        }
    };
    const handleRemoveSkill = (index) => {
        setSelectedSkills(selectedSkills.filter((_, i) => i !== index));
    };
    const handleSave = () => {
        const updatedUser = {
            ...user,
            bio,
            skills: selectedSkills,
        };
        onUpdate(updatedUser);
        setIsEditing(false);
    };
    const handleDeleteAccount = async () => {
        if (window.confirm('¿Estás seguro de que deseas eliminar tu cuenta y todos tus datos? Esta acción no se puede deshacer.')) {
            // Aquí deberías llamar al endpoint de borrado de cuenta (a implementar)
            // Por ahora, solo mostramos un mensaje
            alert('Funcionalidad de eliminación de cuenta próximamente.');
            // Si ya tienes la función, aquí puedes cerrar sesión o redirigir
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Mi Perfil" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: onInviteClick, className: "flex items-center gap-2", children: [_jsx(Share2, { size: 18 }), "Invitar amigos"] }), _jsxs(Button, { variant: "destructive", onClick: onLogout, className: "flex items-center gap-2", children: [_jsx(LogOut, { size: 18 }), "Salir"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-24 h-24 rounded-full bg-blue-200 flex items-center justify-center text-5xl font-bold text-white", children: user.name.charAt(0).toUpperCase() }), _jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: user.name }), _jsx("p", { className: "text-gray-600", children: user.email }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: user.role === 'patron' ? '⚓ Patrón' : '🚣 Viajero' }), user.boatName && (_jsxs("p", { className: "text-sm font-medium text-blue-600 mt-2", children: ["\uD83D\uDEA4 ", user.boatName, " ", user.boatType && `(${user.boatType})`] })), _jsxs("div", { className: "mt-3", children: [_jsx(RatingStars, { rating: user.averageRating || 0, readonly: true }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: [user.averageRating?.toFixed(1) || 'Sin valoraciones', " \u2605"] })] })] })] }) }), _jsx(CardContent, { className: "space-y-4", children: !isEditing ? (_jsxs(_Fragment, { children: [user.bio && (_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900 mb-2", children: "Sobre m\u00ED" }), _jsx("p", { className: "text-gray-600 text-sm", children: user.bio })] })), user.skills && user.skills.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900 mb-2", children: "Habilidades" }), _jsx("div", { className: "flex flex-wrap gap-2", children: user.skills.map((skill) => (_jsxs("span", { className: "inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full", children: [skill.name, ' ', _jsxs("span", { className: "text-xs", children: ["(", skill.level, ")"] })] }, skill.name))) })] })), _jsxs("div", { className: "pt-4 space-y-2", children: [_jsx(Button, { onClick: () => setIsEditing(true), variant: "outline", className: "w-full", children: "Editar perfil" }), _jsx(Button, { onClick: handleDeleteAccount, variant: "destructive", className: "w-full", children: "Eliminar mi cuenta y datos" })] })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Biograf\u00EDa" }), _jsx("textarea", { value: bio, onChange: (e) => setBio(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", rows: 3 })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900 mb-3", children: "Habilidades" }), selectedSkills.length > 0 && (_jsx("div", { className: "mb-3 space-y-2", children: selectedSkills.map((skill, idx) => (_jsxs("div", { className: "flex items-center justify-between bg-blue-50 p-2 rounded", children: [_jsxs("span", { className: "text-sm", children: [skill.name, " (", skill.level, ")"] }), _jsx("button", { type: "button", onClick: () => handleRemoveSkill(idx), className: "text-red-600 hover:text-red-800 text-sm", children: "Eliminar" })] }, idx))) })), _jsxs("div", { className: "space-y-2", children: [_jsxs(Select, { value: newSkillName, onChange: (e) => setNewSkillName(e.target.value), children: [_jsx("option", { value: "", children: "Selecciona una habilidad" }), AVAILABLE_SKILLS.map((skill) => (_jsx("option", { value: skill, children: skill }, skill)))] }), _jsxs(Select, { value: newSkillLevel, onChange: (e) => setNewSkillLevel(e.target.value), children: [_jsx("option", { value: "principiante", children: "Principiante" }), _jsx("option", { value: "intermedio", children: "Intermedio" }), _jsx("option", { value: "experto", children: "Experto" })] }), _jsx(Button, { type: "button", onClick: () => handleAddSkill(), variant: "outline", className: "w-full", children: "Agregar habilidad" })] })] }), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsx(Button, { onClick: handleSave, className: "flex-1", children: "Guardar cambios" }), _jsx(Button, { variant: "outline", onClick: () => setIsEditing(false), className: "flex-1", children: "Cancelar" })] })] })) })] })] }));
}
