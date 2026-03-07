import React, { useState, useEffect } from 'react';
import { User, Trip, Reservation, Message, Conversation } from './types';
import { useAuth, useTrips, useReservations, useChat } from './hooks/useApp';
import { getUsers, saveUsers, getTrips, saveTrips } from './utils/storage';
import { userAPI, tripAPI, reservationAPI, messageAPI, mapUser, mapTrip } from './utils/api';
import { Auth } from './components/Auth';
import { TripList } from './components/TripList';
import { CreateTrip } from './components/CreateTrip';
import { Profile } from './components/Profile';
import { ChatView } from './components/ChatView';
import { InviteFriends } from './components/InviteFriends';
import { Donate } from './components/Donate';
import { ShareQR } from './components/ShareQR';
import { ReservationCard } from './components/ReservationCard';
import { TripTrackingCard } from './components/TripTrackingCard';
import { Button } from './components/ui/Button';
import { Card, CardContent } from './components/ui/Card';
import { MessageSquare, Anchor, Calendar, User as UserIcon } from 'lucide-react';

type Page = 'trips' | 'profile' | 'chat' | 'reservations' | 'tracking';

function App() {
  const { currentUser, register, logout } = useAuth();
  const { trips, addTrip, updateTrip } = useTrips();
  const { reservations, addReservation, updateReservation } = useReservations();
  const { conversations, messages, sendMessage, getConversationMessages, getUserConversations } = useChat();

  const [currentPage, setCurrentPage] = useState<Page>('trips');
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [showShareQR, setShowShareQR] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    userAPI.getAll().then((response) => {
      setAllUsers(response.data.map(mapUser));
    }).catch((err) => console.error('Error fetching users:', err));
  }, []);

  if (!currentUser) {
    return (
      <Auth
        onRegister={(user) => {
          // Check if user already exists (login vs register)
          const existingUser = allUsers.find((u) => u.email === user.email);
          
          if (existingUser) {
            // Login: user already exists
            register(existingUser);
          } else {
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
        }}
      />
    );
  }

  const handleCreateTrip = (tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
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

  const handleReserve = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    const reservationData = {
      tripId,
      travelerId: currentUser.id,
      patronId: trip.patronId,
      status: 'pending' as const,
    };

    reservationAPI.create(reservationData).then((response) => {
      addReservation(response.data);
      alert('✅ Reserva solicitada. El patrón revisará tu solicitud.');
    }).catch((err) => {
      console.error('Error creating reservation:', err);
      alert('Error al hacer la reserva');
    });
  };

  const handleChat = (patronId: string) => {
    const conversationId = [currentUser.id, patronId].sort().join('-');
    setSelectedConversation(conversationId);
    setCurrentPage('chat');
    setShowChat(true);
  };

  const handleSendMessage = (text: string) => {
    if (!selectedConversation) return;
    
    const newMessage: Message = {
      id: crypto.randomUUID(),
      senderId: currentUser.id,
      receiverId: selectedConversation.split('-').find((id) => id !== currentUser.id) || '',
      conversationId: selectedConversation,
      text,
      createdAt: Date.now(),
    };
    sendMessage(newMessage);
  };

  const handleUpdateUser = (user: User) => {
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
  const myReservations = reservations.filter(
    (r) => r.travelerId === currentUser.id || r.patronId === currentUser.id
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        {currentPage === 'trips' && (
          <TripList
            trips={trips}
            users={allUsers}
            currentUserId={currentUser.id}
            onCreateTrip={() => setShowCreateTrip(true)}
            onReserve={handleReserve}
            onChat={handleChat}
            reservations={reservations}
          />
        )}

        {currentPage === 'profile' && (
          <Profile
            user={currentUser}
            onUpdate={handleUpdateUser}
            onLogout={() => {
              logout();
              setCurrentPage('trips');
            }}
            onInviteClick={() => setShowInvite(true)}
          />
        )}

        {currentPage === 'reservations' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {currentUser.role === 'patron' ? 'Solicitudes de reserva' : 'Mis reservas'}
            </h1>

            {myReservations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">
                    {currentUser.role === 'patron'
                      ? 'No tienes solicitudes de reserva'
                      : 'No has hecho reservas'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myReservations.map((reservation) => {
                  const trip = trips.find((t) => t.id === reservation.tripId);
                  const user = allUsers.find((u) =>
                    currentUser.role === 'patron'
                      ? u.id === reservation.travelerId
                      : u.id === reservation.patronId
                  );

                  if (!trip || !user) return null;

                  return (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      trip={trip}
                      user={user}
                      onAccept={
                        currentUser.role === 'patron' && reservation.status === 'pending'
                          ? () => updateReservation(reservation.id, { status: 'accepted' })
                          : undefined
                      }
                      onReject={
                        currentUser.role === 'patron' && reservation.status === 'pending'
                          ? () => updateReservation(reservation.id, { status: 'rejected' })
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentPage === 'chat' && (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Mensajes</h1>

            {!showChat && (
              <div className="space-y-3">
                {myConversations.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No tienes conversaciones</p>
                    </CardContent>
                  </Card>
                ) : (
                  myConversations.map((conv) => {
                    const otherUserId = conv.participants.find((p) => p !== currentUser.id);
                    const otherUser = allUsers.find((u) => u.id === otherUserId);

                    if (!otherUser) return null;

                    return (
                      <Card
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv.id);
                          setShowChat(true);
                        }}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {otherUser.name}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-1">
                                {conv.lastMessage?.text || 'Sin mensajes'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(conv.updatedAt).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-around">
          <Button
            variant={currentPage === 'trips' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setCurrentPage('trips')}
            title="Viajes"
          >
            <Anchor size={24} />
          </Button>

          <Button
            variant={currentPage === 'reservations' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setCurrentPage('reservations')}
            title="Reservas"
          >
            <Calendar size={24} />
          </Button>

          <Button
            variant={currentPage === 'chat' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setCurrentPage('chat')}
            title="Mensajes"
          >
            <MessageSquare size={24} />
          </Button>

          <Button
            variant={currentPage === 'profile' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setCurrentPage('profile')}
            title="Perfil"
          >
            <UserIcon size={24} />
          </Button>
        </div>
      </nav>

      {/* Share QR floating button */}
      <button
        onClick={() => setShowShareQR(true)}
        className="fixed bottom-28 right-4 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg"
        title="Compartir BarcoStop"
      >
        🔗
      </button>

      {/* PayPal floating button */}
      <button
        onClick={() => setShowDonate(true)}
        className="fixed bottom-16 right-4 bg-teal-500 hover:bg-teal-600 text-white p-3 rounded-full shadow-lg"
        title="Donar a BarcoStop"
      >
        💙
      </button>

      {/* Modals */}
      {showCreateTrip && (
        <CreateTrip
          onCreate={handleCreateTrip}
          onCancel={() => setShowCreateTrip(false)}
          patronId={currentUser.id}
        />
      )}

      {showChat && selectedConversation && (
        <ChatView
          conversation={{
            id: selectedConversation,
            participants: [currentUser.id, selectedConversation.split('-').find((id) => id !== currentUser.id) || ''],
            updatedAt: Date.now(),
          }}
          messages={conversationMessages}
          currentUserId={currentUser.id}
          users={allUsers}
          onSendMessage={handleSendMessage}
          onClose={() => setShowChat(false)}
        />
      )}

      {showInvite && (
        <InviteFriends
          onInvite={(email) => {
            console.log('Invitar a:', email);
            // Aquí se integraría con un backend real
          }}
          onClose={() => setShowInvite(false)}
        />
      )}

      {showDonate && <Donate onClose={() => setShowDonate(false)} />}

      {showShareQR && <ShareQR onClose={() => setShowShareQR(false)} />}

      {/* Padding for fixed bottom nav */}
      <div className="h-32"></div>
    </div>
  );
}

export default App;
