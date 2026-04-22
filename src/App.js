import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth, useTrips, useReservations, useChat } from './hooks/useApp';
import { getUsers, saveUsers } from './utils/storage';
import { userAPI, tripAPI, reservationAPI, mapUser, mapTrip } from './utils/api';
import { Auth } from './components/Auth';
import { TripList } from './components/TripList';
import { CreateTrip } from './components/CreateTrip';
import { Profile } from './components/Profile';
import { ChatView } from './components/ChatView';
import { InviteFriends } from './components/InviteFriends';
import { Donate } from './components/Donate';
import { ShareQR } from './components/ShareQR';
import { ReservationCard } from './components/ReservationCard';
import { Button } from './components/ui/Button';
import { Card, CardContent } from './components/ui/Card';
import { MessageSquare, Anchor, Calendar, User as UserIcon } from 'lucide-react';
function App() {
    const { currentUser, register, logout } = useAuth();
    const { trips, addTrip } = useTrips();
    const { reservations, addReservation, updateReservation } = useReservations();
    const { sendMessage, getConversationMessages, getUserConversations } = useChat();
    const [currentPage, setCurrentPage] = useState('trips');
    const [showCreateTrip, setShowCreateTrip] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showInvite, setShowInvite] = useState(false);
    const [showDonate, setShowDonate] = useState(false);
    const [showShareQR, setShowShareQR] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    useEffect(() => {
        userAPI.getAll().then((response) => {
            setAllUsers(response.data.map(mapUser));
        }).catch((err) => console.error('Error fetching users:', err));
    }, []);
    if (!currentUser) {
        return (_jsx(Auth, { onRegister: (user) => {
                // Check if user already exists (login vs register)
                const existingUser = allUsers.find((u) => u.email === user.email);
                if (existingUser) {
                    // Login: user already exists
                    register(existingUser);
                }
                else {
                    // Register: new user
                    userAPI.register(user).then((response) => {
                        const registeredUser = mapUser(response.data);
                        const users = getUsers();
                        saveUsers([...users, registeredUser]);
                        setAllUsers([...users, registeredUser]);
                        register(registeredUser);
                    }).catch((err) => {
                        console.error('Error registering user:', err);
                        alert('Error al registrar. Intenta de nuevo.');
                    });
                }
            } }));
    }
    const handleCreateTrip = (tripData) => {
        tripAPI.create(tripData).then((response) => {
            const mappedTrip = mapTrip(response.data);
            addTrip(mappedTrip);
            setShowCreateTrip(false);
            alert('¡Viaje publicado exitosamente!');
        }).catch((err) => {
            console.error('Error creating trip:', err);
            alert('Error al publicar el viaje');
        });
    };
    const handleReserve = (tripId) => {
        const trip = trips.find((t) => t.id === tripId);
        if (!trip)
            return;
        const reservationData = {
            tripId,
            travelerId: currentUser.id,
            patronId: trip.patronId,
            status: 'pending',
        };
        reservationAPI.create(reservationData).then((response) => {
            addReservation(response.data);
            alert('✅ Reserva solicitada. El patrón revisará tu solicitud.');
        }).catch((err) => {
            console.error('Error creating reservation:', err);
            alert('Error al hacer la reserva');
        });
    };
    const handleChat = (patronId) => {
        const conversationId = [currentUser.id, patronId].sort().join('-');
        setSelectedConversation(conversationId);
        setCurrentPage('chat');
        setShowChat(true);
    };
    const handleSendMessage = (text) => {
        if (!selectedConversation)
            return;
        const newMessage = {
            id: crypto.randomUUID(),
            senderId: currentUser.id,
            receiverId: selectedConversation.split('-').find((id) => id !== currentUser.id) || '',
            conversationId: selectedConversation,
            text,
            createdAt: Date.now(),
        };
        sendMessage(newMessage);
    };
    const handleUpdateUser = (user) => {
        const users = getUsers();
        const newUsers = users.map((u) => (u.id === user.id ? user : u));
        saveUsers(newUsers);
        setAllUsers(newUsers);
        // También actualizar el usuario actual
        register(user);
    };
    const conversationMessages = selectedConversation
        ? getConversationMessages(selectedConversation)
        : [];
    const myConversations = getUserConversations(currentUser.id);
    const myReservations = reservations.filter((r) => r.travelerId === currentUser.id || r.patronId === currentUser.id);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsxs("main", { className: "max-w-4xl mx-auto p-4 sm:p-6", children: [currentPage === 'trips' && (_jsx(TripList, { trips: trips, users: allUsers, currentUserId: currentUser.id, onCreateTrip: () => setShowCreateTrip(true), onReserve: handleReserve, onChat: handleChat, reservations: reservations })), currentPage === 'profile' && (_jsx(Profile, { user: currentUser, onUpdate: handleUpdateUser, onLogout: () => {
                            logout();
                            setCurrentPage('trips');
                        }, onInviteClick: () => setShowInvite(true) })), currentPage === 'reservations' && (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: currentUser.role === 'patron' ? 'Solicitudes de reserva' : 'Mis reservas' }), myReservations.length === 0 ? (_jsx(Card, { children: _jsx(CardContent, { className: "py-12 text-center", children: _jsx("p", { className: "text-gray-500", children: currentUser.role === 'patron'
                                            ? 'No tienes solicitudes de reserva'
                                            : 'No has hecho reservas' }) }) })) : (_jsx("div", { className: "space-y-4", children: myReservations.map((reservation) => {
                                    const trip = trips.find((t) => t.id === reservation.tripId);
                                    const user = allUsers.find((u) => currentUser.role === 'patron'
                                        ? u.id === reservation.travelerId
                                        : u.id === reservation.patronId);
                                    if (!trip || !user)
                                        return null;
                                    return (_jsx(ReservationCard, { reservation: reservation, trip: trip, user: user, onAccept: currentUser.role === 'patron' && reservation.status === 'pending'
                                            ? () => updateReservation(reservation.id, { status: 'accepted' })
                                            : undefined, onReject: currentUser.role === 'patron' && reservation.status === 'pending'
                                            ? () => updateReservation(reservation.id, { status: 'rejected' })
                                            : undefined }, reservation.id));
                                }) }))] })), currentPage === 'chat' && (_jsxs("div", { className: "space-y-4", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Mensajes" }), !showChat && (_jsx("div", { className: "space-y-3", children: myConversations.length === 0 ? (_jsx(Card, { children: _jsxs(CardContent, { className: "py-12 text-center", children: [_jsx(MessageSquare, { size: 48, className: "mx-auto text-gray-300 mb-3" }), _jsx("p", { className: "text-gray-500", children: "No tienes conversaciones" })] }) })) : (myConversations.map((conv) => {
                                    const otherUserId = conv.participants.find((p) => p !== currentUser.id);
                                    const otherUser = allUsers.find((u) => u.id === otherUserId);
                                    if (!otherUser)
                                        return null;
                                    return (_jsx(Card, { onClick: () => {
                                            setSelectedConversation(conv.id);
                                            setShowChat(true);
                                        }, className: "cursor-pointer hover:shadow-md transition-shadow", children: _jsx(CardContent, { className: "pt-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: otherUser.name }), _jsx("p", { className: "text-sm text-gray-600 line-clamp-1", children: conv.lastMessage?.text || 'Sin mensajes' })] }), _jsx("div", { className: "text-right", children: _jsx("p", { className: "text-xs text-gray-500", children: new Date(conv.updatedAt).toLocaleDateString('es-ES') }) })] }) }) }, conv.id));
                                })) }))] }))] }), _jsx("nav", { className: "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3", children: _jsxs("div", { className: "max-w-4xl mx-auto flex justify-around", children: [_jsx(Button, { variant: currentPage === 'trips' ? 'default' : 'ghost', size: "icon", onClick: () => setCurrentPage('trips'), title: "Viajes", children: _jsx(Anchor, { size: 24 }) }), _jsx(Button, { variant: currentPage === 'reservations' ? 'default' : 'ghost', size: "icon", onClick: () => setCurrentPage('reservations'), title: "Reservas", children: _jsx(Calendar, { size: 24 }) }), _jsx(Button, { variant: currentPage === 'chat' ? 'default' : 'ghost', size: "icon", onClick: () => setCurrentPage('chat'), title: "Mensajes", children: _jsx(MessageSquare, { size: 24 }) }), _jsx(Button, { variant: currentPage === 'profile' ? 'default' : 'ghost', size: "icon", onClick: () => setCurrentPage('profile'), title: "Perfil", children: _jsx(UserIcon, { size: 24 }) })] }) }), _jsx("button", { onClick: () => setShowShareQR(true), className: "fixed bottom-28 right-4 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg", title: "Compartir BarcoStop", children: "\uD83D\uDD17" }), _jsx("button", { onClick: () => setShowDonate(true), className: "fixed bottom-16 right-4 bg-teal-500 hover:bg-teal-600 text-white p-3 rounded-full shadow-lg", title: "Donar a BarcoStop", children: "\uD83D\uDC99" }), showCreateTrip && (_jsx(CreateTrip, { onCreate: handleCreateTrip, onCancel: () => setShowCreateTrip(false), patronId: currentUser.id })), showChat && selectedConversation && (_jsx(ChatView, { conversation: {
                    id: selectedConversation,
                    participants: [currentUser.id, selectedConversation.split('-').find((id) => id !== currentUser.id) || ''],
                    updatedAt: Date.now(),
                }, messages: conversationMessages, currentUserId: currentUser.id, users: allUsers, onSendMessage: handleSendMessage, onClose: () => setShowChat(false) })), showInvite && (_jsx(InviteFriends, { onInvite: (email) => {
                    console.log('Invitar a:', email);
                    // Aquí se integraría con un backend real
                }, onClose: () => setShowInvite(false) })), showDonate && _jsx(Donate, { onClose: () => setShowDonate(false) }), showShareQR && _jsx(ShareQR, { onClose: () => setShowShareQR(false) }), _jsx("div", { className: "h-32" })] }));
}
export default App;
