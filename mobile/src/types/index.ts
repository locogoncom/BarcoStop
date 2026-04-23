export type Role = 'patron' | 'viajero';

export type UserSkill = {
  name: string;
  level: 'principiante' | 'intermedio' | 'experto';
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  bio?: string | null;
  boatName?: string | null;
  boatType?: string | null;
  skills?: UserSkill[];
  rating?: number;
  reviewCount?: number;
};

export type Patron = {
  id: string;
  name: string;
  boatName?: string;
  boatType?: string;
  averageRating: number;
};

export type Trip = {
  id: string;
  tripKind?: 'trip' | 'regatta';
  title: string;
  captainNote?: string;
  boatImageUrl?: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime?: string;
  timeWindow?: 'morning' | 'afternoon' | 'night';
  availableSeats: number;
  price: number;
  contributionType?: string;
  contributionNote?: string;
  patronId: string;
  status: 'active' | 'completed' | 'cancelled';
  patron?: Patron;
};

export type Boat = {
  id: string;
  patronId: string;
  name: string;
  type: string;
  capacity: number;
  length?: number;
  yearBuilt?: number;
  fuelType?: string;
  licenseNumber?: string;
  safetyEquipment: string[];
  description: string;
  status: 'active' | 'maintenance' | 'inactive';
  createdAt?: string;
};

export type Rating = {
  id: string;
  userId: string;
  ratedBy: string;
  rating: number;
  comment?: string;
  createdAt?: string;
};

export type SessionData = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  token?: string;
};
export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export type Conversation = {
  id: string;
  tripId?: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  updatedAt: string;
};

export type RegattaParticipant = {
  reservationId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  status: string;
  joinedAt?: string;
};

export type RegattaChatState = {
  conversationId: string;
  participants: RegattaParticipant[];
};

export type SupportMessage = {
  id: string;
  userId: string;
  message: string;
  adminReply?: string;
  status: 'open' | 'answered' | 'closed';
  createdAt: number;
  updatedAt: number;
  repliedAt?: number;
};