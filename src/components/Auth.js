import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { userAPI, mapUser } from '../utils/api';
export function Auth({ onRegister }) {
    const [isLogin, setIsLogin] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('viajero');
    const [boatName, setBoatName] = useState('');
    const [boatType, setBoatType] = useState('');
    const [bio, setBio] = useState('');
    const [users, setUsers] = useState([]);
    useEffect(() => {
        userAPI.getAll().then((response) => {
            setUsers(response.data.map(mapUser));
        }).catch((err) => console.error('Error fetching users:', err));
    }, []);
    const handleLogin = (e) => {
        e.preventDefault();
        const user = users.find((u) => u.email === email);
        if (!user) {
            alert('Usuario no encontrado. Por favor, verifica tu email o crea una cuenta.');
            return;
        }
        onRegister(user);
    };
    const handleRegister = (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim())
            return;
        const newUser = {
            name: name.trim(),
            email: email.trim(),
            role,
            ...(role === 'patron' && { boatName, boatType }),
            bio: bio.trim() || undefined,
        };
        onRegister(newUser);
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 flex items-center justify-center p-4 relative overflow-hidden", style: {
            backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)
        `,
        }, children: [_jsxs("div", { className: "absolute inset-0 opacity-10", children: [_jsx("div", { className: "absolute w-96 h-96 bg-white rounded-full blur-3xl -top-20 -left-20 animate-pulse" }), _jsx("div", { className: "absolute w-96 h-96 bg-white rounded-full blur-3xl -bottom-20 -right-20 animate-pulse", style: { animationDelay: '1s' } })] }), _jsxs(Card, { className: "w-full max-w-md relative z-10 shadow-2xl", children: [_jsxs(CardHeader, { className: "text-center py-6 bg-gradient-to-b from-blue-50 to-white", children: [_jsxs("div", { className: "flex items-center justify-center gap-2 mb-2", children: [_jsx("div", { className: "text-4xl", children: "\u2693" }), _jsx("h1", { className: "text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent", children: "BarcoStop" })] }), _jsx("p", { className: "text-gray-600 text-sm mt-3", children: "Comparte viajes en barco, conoce gente" }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "La comunidad de navegantes" })] }), _jsxs(CardContent, { children: [!isLogin ? (_jsxs("form", { onSubmit: handleRegister, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nombre completo" }), _jsx(Input, { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "Tu nombre", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx(Input, { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "tu@email.com", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u00BFEres...?" }), _jsxs(Select, { value: role, onChange: (e) => setRole(e.target.value), children: [_jsx("option", { value: "viajero", children: "Viajero" }), _jsx("option", { value: "patron", children: "Patr\u00F3n (Propietario de barco)" })] })] }), role === 'patron' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nombre del barco" }), _jsx(Input, { type: "text", value: boatName, onChange: (e) => setBoatName(e.target.value), placeholder: "Ej: Mar\u00EDa del Mar" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Tipo de barco" }), _jsxs(Select, { value: boatType, onChange: (e) => setBoatType(e.target.value), children: [_jsx("option", { value: "", children: "Selecciona un tipo" }), _jsx("option", { value: "velero", children: "Velero" }), _jsx("option", { value: "motonave", children: "Motonave" }), _jsx("option", { value: "catamar\u00E1n", children: "Catamar\u00E1n" }), _jsx("option", { value: "lancha", children: "Lancha" }), _jsx("option", { value: "otro", children: "Otro" })] })] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Biograf\u00EDa (opcional)" }), _jsx(Input, { type: "text", value: bio, onChange: (e) => setBio(e.target.value), placeholder: "Cu\u00E9ntanos sobre ti" })] }), _jsx(Button, { type: "submit", className: "w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700", children: "\uD83D\uDE80 Crear cuenta" }), _jsxs("p", { className: "text-center text-sm text-gray-600", children: ["\u00BFYa tienes cuenta?", ' ', _jsx("button", { type: "button", onClick: () => {
                                                    setIsLogin(true);
                                                    setEmail('');
                                                }, className: "text-blue-600 hover:text-blue-800 font-medium", children: "Inicia sesi\u00F3n aqu\u00ED" })] })] })) : (_jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx(Input, { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "tu@email.com", required: true })] }), _jsx(Button, { type: "submit", className: "w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700", children: "\uD83D\uDD13 Iniciar sesi\u00F3n" }), _jsxs("p", { className: "text-center text-sm text-gray-600", children: ["\u00BFNo tienes cuenta?", ' ', _jsx("button", { type: "button", onClick: () => {
                                                    setIsLogin(false);
                                                    setEmail('');
                                                    setName('');
                                                    setRole('viajero');
                                                    setBoatName('');
                                                    setBoatType('');
                                                    setBio('');
                                                }, className: "text-blue-600 hover:text-blue-800 font-medium", children: "Reg\u00EDstrate aqu\u00ED" })] })] })), _jsxs("p", { className: "text-center text-sm text-gray-600 pt-4 border-t border-gray-200", children: ["\u2693 \u00DAnete a navegantes del mundo  ", _jsx("br", {}), "\uD83C\uDF0A Comparte aventuras \u2022 Conoce gente \u2022 Viaja diferente"] })] })] })] }));
}
